import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { PaymentStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import {
  MarketplacePreferenceRequest,
  MarketplacePreferenceResponse,
} from "@profesional/contracts";
import { PrismaService } from "../database/prisma.service";
import { CommissionService } from "./commission.service";
import { MercadoPagoService } from "./mercadopago.service";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly _prisma: PrismaService,
    private readonly _mercadoPagoService: MercadoPagoService,
    private readonly _commissionService: CommissionService
  ) {}

  async createPayment(bookingId: string, amount: number, description: string) {
    this.logger.debug(
      `💰 Creating marketplace payment for booking ${bookingId}`
    );

    // Calculate commission
    const platformFee = await this._commissionService.calculatePlatformFee(
      new Decimal(amount)
    );
    const professionalAmount = new Decimal(amount).sub(platformFee);

    // Create payment record
    const payment = await this._prisma.payment.create({
      data: {
        amount,
        netAmount: professionalAmount, // Amount after platform fee
        currency: "ARS",
        status: PaymentStatus.PENDING,
        metadata: {
          bookingId,
          description,
          platformFee,
          professionalAmount,
          type: "marketplace_split",
        },
      },
    });

    this.logger.log("✅ Payment record created", {
      payment_id: payment.id,
      total_amount: amount,
      platform_fee: platformFee,
      professional_amount: professionalAmount,
    });

    return {
      payment_id: payment.id,
      amount,
      platform_fee: platformFee,
      professional_amount: professionalAmount,
    };
  }

  async getPaymentById(paymentId: string) {
    this.logger.debug(`📄 Getting payment by ID: ${paymentId}`);

    const payment = await this._prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            professional: {
              select: { id: true, email: true, name: true },
            },
            client: {
              select: { id: true, email: true, name: true },
            },
          },
        },
        events: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!payment) {
      throw new BadRequestException(`Payment ${paymentId} not found`);
    }

    return payment;
  }

  async handleWebhook(data: any, _signature: string) {
    this.logger.log("🔔 Processing MP marketplace webhook", {
      id: data.id,
      type: data.type,
      action: data.action,
    });

    try {
      // Procesar según tipo de notificación
      const processedData =
        await this._mercadoPagoService.processWebhookNotification(data);

      if (!processedData) {
        this.logger.warn("⚠️ No data to process from webhook");
        return { received: true };
      }

      // Guardar evento de webhook
      await this._prisma.paymentEvent.create({
        data: {
          paymentId: `temp-${Date.now()}`, // Temporal hasta encontrar el payment real
          externalId: data.id,
          type: data.type,
          rawPayload: data,
          idempotencyKey: `webhook-${data.id}-${Date.now()}`,
          data: processedData,
        },
      });

      // Procesar según tipo
      if (data.type === "payment") {
        await this.processPaymentNotification(processedData);
      } else if (data.type === "merchant_order") {
        await this.processMerchantOrderNotification(processedData);
      }

      this.logger.log("✅ Webhook processed successfully");
      return { received: true, processed: true };
    } catch (error) {
      this.logger.error("❌ Error processing webhook", error);

      // Guardar error para debugging
      await this._prisma.paymentEvent.create({
        data: {
          paymentId: `error-${Date.now()}`,
          externalId: data.id,
          type: data.type || "webhook_error",
          rawPayload: data,
          idempotencyKey: `error-${data.id || Date.now()}-${Date.now()}`,
          data: { error: (error as Error).message, originalData: data },
        },
      });

      throw error;
    }
  }

  private async processPaymentNotification(mpPayment: any) {
    this.logger.log("💰 Processing payment notification", {
      payment_id: mpPayment.id,
      status: mpPayment.status,
      external_reference: mpPayment.external_reference,
    });

    // El external_reference es el bookingId
    const bookingId = mpPayment.external_reference;

    // Buscar payment por bookingId (a través de la relación con booking)
    const booking = await this._prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true, professional: true },
    });

    if (!booking || !booking.payment) {
      this.logger.warn(
        `❌ Booking or payment not found for external reference: ${bookingId}`
      );
      return;
    }

    const payment = booking.payment;

    // Mapear status de MP a nuestros status
    let newStatus: PaymentStatus;
    switch (mpPayment.status) {
      case "approved":
        newStatus = PaymentStatus.COMPLETED;
        break;
      case "pending":
        newStatus = PaymentStatus.PENDING;
        break;
      case "rejected":
      case "cancelled":
        newStatus = PaymentStatus.FAILED;
        break;
      default:
        newStatus = PaymentStatus.PENDING;
    }

    // Actualizar payment
    await this._prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        gatewayPaymentId: mpPayment.id.toString(),
        paymentId: mpPayment.id.toString(), // MP payment ID
        paidAt: newStatus === PaymentStatus.COMPLETED ? new Date() : null,
        updatedAt: new Date(),
      },
    });

    // Si está aprobado, actualizar booking y procesar comisiones
    if (newStatus === PaymentStatus.COMPLETED) {
      // Actualizar booking a WAITING_FOR_PROFESSIONAL
      await this._prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: "WAITING_FOR_PROFESSIONAL",
        },
      });

      this.logger.log("✅ Booking updated to WAITING_FOR_PROFESSIONAL", {
        booking_id: bookingId,
        professional_id: booking.professionalId,
      });

      // Crear notificación para el profesional
      await this._prisma.notification.create({
        data: {
          userId: booking.professional.userId, // Notificar al usuario del profesional
          type: "BOOKING_REQUEST",
          title: "Nueva solicitud de consulta",
          message: `Tienes una nueva solicitud de consulta pagada. El cliente ya realizó el pago de $${payment.amount}.`,
          payload: {
            bookingId: booking.id,
            amount: payment.amount.toString(),
            paymentId: payment.id,
            clientId: booking.clientId,
          },
        },
      });

      this.logger.log("✅ Notification created for professional", {
        professional_user_id: booking.professional.userId,
        booking_id: bookingId,
      });

      // TODO: Enviar email al profesional
      // await this.emailService.sendBookingRequestEmail(booking);

      await this.processApprovedPayment(payment, mpPayment);
    }

    this.logger.log("✅ Payment notification processed", {
      payment_id: payment.id,
      booking_id: bookingId,
      new_status: newStatus,
      mp_status: mpPayment.status,
    });
  }

  private async processMerchantOrderNotification(merchantOrder: any) {
    this.logger.log("📋 Processing merchant order notification", {
      order_id: merchantOrder.id,
      preference_id: merchantOrder.preference_id,
      payments_count: merchantOrder.payments?.length || 0,
    });

    // Aquí puedes procesar órdenes de merchant si necesitas lógica específica
    // Por ejemplo, para manejar pagos parciales o múltiples pagos
  }

  private async processApprovedPayment(payment: any, mpPayment: any) {
    this.logger.log("🎉 Processing approved marketplace payment", {
      payment_id: payment.id,
      amount: mpPayment.transaction_amount,
      fee_details: mpPayment.fee_details,
    });

    try {
      // Calcular y guardar fees reales de MP
      const mpFees =
        mpPayment.fee_details?.reduce(
          (total: number, fee: any) => total + fee.amount,
          0
        ) || 0;

      // Actualizar con fees reales
      await this._prisma.payment.update({
        where: { id: payment.id },
        data: {
          gatewayFees: new Decimal(mpFees),
          netAmount: new Decimal(mpPayment.transaction_amount).sub(
            new Decimal(mpFees)
          ),
          metadata: {
            ...payment.metadata,
            mp_fees: mpFees,
            mp_transaction_amount: mpPayment.transaction_amount,
            processed_at: new Date().toISOString(),
          },
        },
      });

      this.logger.log("✅ Approved payment processed with real fees", {
        payment_id: payment.id,
        mp_fees: mpFees,
        net_amount: mpPayment.transaction_amount - mpFees,
      });
    } catch (error) {
      this.logger.error("❌ Error processing approved payment", error);
      throw error;
    }
  }

  async getPayment(paymentId: string) {
    this.logger.debug(`Getting payment ${paymentId}`);

    const payment = await this._prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        events: {
          orderBy: { createdAt: "desc" },
          take: 10, // Últimos 10 eventos
        },
        booking: {
          include: {
            professional: {
              select: { id: true, name: true, email: true },
            },
            client: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new BadRequestException(`Payment ${paymentId} not found`);
    }

    return payment;
  }

  /**
   * STEP 2: Crear preferencia de marketplace con split payments
   */
  async createMarketplacePreference(
    request: MarketplacePreferenceRequest
  ): Promise<MarketplacePreferenceResponse> {
    this.logger.log("🏪 Creating marketplace preference with split payments", {
      booking_id: request.bookingId,
      total_amount: request.amount,
      professional_id: request.professionalId,
      commission_rate: request.platformCommissionRate,
    });

    // Calcular comisiones
    const totalAmount = new Decimal(request.amount);
    const platformCommissionRate = new Decimal(request.platformCommissionRate);
    const platformFee = totalAmount.mul(platformCommissionRate).div(100);
    const professionalAmount = totalAmount.sub(platformFee);

    this.logger.debug("💰 Split calculation", {
      total_amount: totalAmount.toNumber(),
      platform_fee: platformFee.toNumber(),
      professional_amount: professionalAmount.toNumber(),
      commission_rate: `${platformCommissionRate.toNumber()}%`,
    });

    // Crear payment record
    const payment = await this._prisma.payment.create({
      data: {
        amount: totalAmount.toNumber(),
        platformFee: platformFee.toNumber(),
        netAmount: professionalAmount.toNumber(), // Required field
        currency: "ARS",
        status: PaymentStatus.PENDING,
        payerEmail: request.payerEmail,
        metadata: {
          type: "marketplace_split",
          bookingId: request.bookingId, // Store bookingId in metadata
          customerId: request.customerId,
          professionalId: request.professionalId,
          professionalMPUserId: request.professionalMPUserId,
          platformCommissionRate: platformCommissionRate.toNumber(),
        },
      },
    });

    // Configurar preferencia de MP con split payments
    const mpPreference = {
      items: [
        {
          title: request.title,
          quantity: 1,
          unit_price: totalAmount.toNumber(),
          description: request.description,
        },
      ],
      external_reference: payment.id, // Usar ID del payment como referencia
      marketplace: "PROFESIONAL-MARKETPLACE",
      marketplace_fee: platformFee.toNumber(),
      split_payments: [
        {
          amount: professionalAmount.toNumber(),
          fee_amount: 0, // El profesional no paga fees de MP
          collector: {
            id: request.professionalMPUserId, // MP User ID del profesional
          },
        },
      ],
      back_urls: request.backUrls
        ? {
            success: request.backUrls.success,
            failure: request.backUrls.failure,
            pending: request.backUrls.pending,
          }
        : undefined,
      auto_return: request.autoReturn || "approved",
      notification_url: `${process.env.APP_URL}/api/payments/webhook`,
      payment_methods: {
        installments: request.maxInstallments || 12,
      },
      payer: request.payerEmail
        ? {
            email: request.payerEmail,
          }
        : undefined,
    };

    try {
      // Crear preferencia en MP
      const mpResponse =
        await this._mercadoPagoService.createPreference(mpPreference);

      // Actualizar payment con preferenceId
      await this._prisma.payment.update({
        where: { id: payment.id },
        data: {
          preferenceId: mpResponse.id,
          gatewayPaymentId: mpResponse.collector_id?.toString(),
        },
      });

      const response: MarketplacePreferenceResponse = {
        id: mpResponse.id,
        init_point: mpResponse.init_point,
        sandbox_init_point: mpResponse.sandbox_init_point,
        external_reference: payment.id,
        collector_id: mpResponse.collector_id,
        marketplace_fee: platformFee.toNumber(),
        total_amount: totalAmount.toNumber(),
        professional_amount: professionalAmount.toNumber(),
        platform_fee: platformFee.toNumber(),
        preference_data: mpResponse,
      };

      this.logger.log("✅ Marketplace preference created successfully", {
        preference_id: response.id,
        payment_id: payment.id,
        init_point: response.init_point,
        marketplace_fee: response.marketplace_fee,
      });

      return response;
    } catch (error) {
      this.logger.error("❌ Error creating marketplace preference", error);

      // Marcar payment como fallido
      await this._prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });

      throw error;
    }
  }

  /**
   * STEP 4: Procesar pago con tarjeta de prueba
   */
  async processTestCardPayment(cardData: {
    bookingId: string;
    amount: number;
    cardNumber: string;
    expirationMonth: string;
    expirationYear: string;
    cvv: string;
    cardHolderName: string;
    payerEmail?: string;
  }) {
    this.logger.log("🧪 Processing test card payment", {
      booking_id: cardData.bookingId,
      amount: cardData.amount,
      card_mask: `****-****-****-${cardData.cardNumber.slice(-4)}`,
    });

    // Validar que sea tarjeta de prueba
    const testCards = [
      "5031755734530604", // Visa aprobada
      "4509953566233704", // Mastercard aprobada
      "4774461290010078", // Visa rechazada
    ];

    if (!testCards.includes(cardData.cardNumber)) {
      throw new BadRequestException(
        `Tarjeta ${
          cardData.cardNumber
        } no es una tarjeta de prueba válida. Use: ${testCards.join(", ")}`
      );
    }

    // Simular resultado según tarjeta
    const isApproved = ["5031755734530604", "4509953566233704"].includes(
      cardData.cardNumber
    );

    // Crear payment record
    const payment = await this._prisma.payment.create({
      data: {
        amount: cardData.amount,
        netAmount: cardData.amount, // For test cards, assume full amount
        currency: "ARS",
        status: isApproved ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
        payerEmail: cardData.payerEmail,
        paymentId: cardData.cardNumber.startsWith("5") ? "master" : "visa", // Use paymentId field for method type
        metadata: {
          type: "test_card",
          bookingId: cardData.bookingId, // Store bookingId in metadata
          card_mask: `****-****-****-${cardData.cardNumber.slice(-4)}`,
          test_result: isApproved ? "approved" : "rejected",
          cardholder: cardData.cardHolderName,
        },
      },
    });

    this.logger.log(
      `✅ Test card payment ${isApproved ? "approved" : "rejected"}`,
      {
        payment_id: payment.id,
        status: payment.status,
        amount: payment.amount,
      }
    );

    return {
      payment_id: payment.id,
      status: payment.status,
      amount: payment.amount,
      approved: isApproved,
      message: isApproved
        ? "Pago de prueba aprobado exitosamente"
        : "Pago de prueba rechazado (simulado)",
    };
  }
}
