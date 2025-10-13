import {
  MarketplacePreferenceRequest,
  MarketplacePreferenceResponse,
} from '@marcosstevens2012/contracts';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../database/prisma.service';
import { CommissionService } from './commission.service';
import {
  MPMerchantOrderResponse,
  MPPaymentResponse,
  MPWebhookNotification,
} from './interfaces/mp-responses.interface';
import { MercadoPagoService } from './mercadopago.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly _prisma: PrismaService,
    private readonly _mercadoPagoService: MercadoPagoService,
    private readonly _commissionService: CommissionService,
  ) {}

  async createPayment(bookingId: string, amount: number, description: string) {
    this.logger.debug(`💰 Creating marketplace payment for booking ${bookingId}`);

    // Calculate commission
    const platformFee = await this._commissionService.calculatePlatformFee(new Decimal(amount));
    const professionalAmount = new Decimal(amount).sub(platformFee);

    // Create payment record
    const payment = await this._prisma.payment.create({
      data: {
        amount,
        netAmount: professionalAmount, // Amount after platform fee
        currency: 'ARS',
        status: PaymentStatus.PENDING,
        metadata: {
          bookingId,
          description,
          platformFee,
          professionalAmount,
          type: 'marketplace_split',
        },
      },
    });

    this.logger.log('✅ Payment record created', {
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
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!payment) {
      throw new BadRequestException(`Payment ${paymentId} not found`);
    }

    return payment;
  }

  async handleWebhook(data: MPWebhookNotification) {
    this.logger.log('🔔 Processing MP marketplace webhook', {
      id: data.id,
      type: data.type,
      action: data.action,
      data_id: data.data?.id,
    });

    try {
      // Procesar según tipo de notificación con retry logic
      let processedData;
      let attempts = 0;
      const maxAttempts = 5; // Aumentado de 3 a 5 intentos
      const retryDelay = 3000; // Aumentado de 2s a 3s

      while (attempts < maxAttempts) {
        try {
          attempts++;
          this.logger.debug(`🔄 Attempting to fetch MP data (attempt ${attempts}/${maxAttempts})`);

          processedData = await this._mercadoPagoService.processWebhookNotification(data);
          break; // Éxito, salir del loop
        } catch (error) {
          // Log detallado del error
          console.error(`🔴 ATTEMPT ${attempts} ERROR DETAILS:`, {
            message: error instanceof Error ? error.message : 'Unknown',
            stack: error instanceof Error ? error.stack : undefined,
            fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
          });

          this.logger.warn(`⚠️ Attempt ${attempts} failed to fetch MP data`, {
            error: error instanceof Error ? error.message : 'Unknown error',
            will_retry: attempts < maxAttempts,
          });

          if (attempts >= maxAttempts) {
            // Último intento falló, re-lanzar el error
            throw error;
          }

          // Esperar antes de reintentar
          await new Promise((resolve) => setTimeout(resolve, retryDelay * attempts));
        }
      }

      if (!processedData) {
        this.logger.warn('⚠️ No data to process from webhook after all attempts');

        // Guardar evento fallido para debugging
        await this._prisma.paymentEvent.create({
          data: {
            paymentId: `no-data-${Date.now()}`,
            externalId: data.id ? String(data.id) : null,
            type: data.type || 'unknown',
            rawPayload: JSON.parse(JSON.stringify(data)),
            idempotencyKey: `webhook-no-data-${data.id}-${Date.now()}`,
            data: JSON.parse(JSON.stringify({ message: 'No data returned from MP API' })),
          },
        });

        return { received: true, processed: false, reason: 'No data from MP API' };
      }

      // Guardar evento de webhook
      await this._prisma.paymentEvent.create({
        data: {
          paymentId: `temp-${Date.now()}`, // Temporal hasta encontrar el payment real
          externalId: data.id ? String(data.id) : null,
          type: data.type,
          rawPayload: JSON.parse(JSON.stringify(data)),
          idempotencyKey: `webhook-${data.id}-${Date.now()}`,
          data: JSON.parse(JSON.stringify(processedData)),
        },
      });

      // Procesar según tipo
      if (
        data.type === 'payment' &&
        processedData &&
        typeof processedData === 'object' &&
        'status' in processedData
      ) {
        await this.processPaymentNotification(processedData as MPPaymentResponse);
      } else if (
        data.type === 'merchant_order' &&
        processedData &&
        typeof processedData === 'object' &&
        'order_status' in processedData
      ) {
        await this.processMerchantOrderNotification(processedData as MPMerchantOrderResponse);
      }

      this.logger.log('✅ Webhook processed successfully');
      return { received: true, processed: true };
    } catch (error) {
      this.logger.error('❌ Error processing webhook', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        webhookType: data.type,
        webhookId: data.id,
      });

      // Log adicional con JSON.stringify para ver TODO el error
      console.error(
        '🔴 FULL WEBHOOK ERROR:',
        JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      );

      // Guardar error para debugging
      await this._prisma.paymentEvent.create({
        data: {
          paymentId: `error-${Date.now()}`,
          externalId: data.id ? String(data.id) : null,
          type: data.type || 'webhook_error',
          rawPayload: JSON.parse(JSON.stringify(data)),
          idempotencyKey: `error-${data.id || Date.now()}-${Date.now()}`,
          data: JSON.parse(
            JSON.stringify({
              error: (error as Error).message,
              originalData: data,
            }),
          ),
        },
      });

      throw error;
    }
  }

  private async processPaymentNotification(mpPayment: MPPaymentResponse) {
    this.logger.log('💰 Processing payment notification', {
      payment_id: mpPayment.id,
      status: mpPayment.status,
      external_reference: mpPayment.external_reference,
    });

    try {
      // El external_reference es el bookingId
      const bookingId = mpPayment.external_reference;

      if (!bookingId) {
        this.logger.error('❌ No external_reference (bookingId) in MP payment', {
          payment_id: mpPayment.id,
        });
        throw new Error('No external_reference in payment');
      }

      this.logger.debug('🔍 Looking for booking', { bookingId });

      // Buscar payment por bookingId (a través de la relación con booking)
      const booking = await this._prisma.booking.findUnique({
        where: { id: bookingId },
        include: { payment: true, professional: true },
      });

      if (!booking || !booking.payment) {
        this.logger.warn(`❌ Booking or payment not found for external reference: ${bookingId}`);
        throw new Error(`Booking or payment not found: ${bookingId}`);
      }

      this.logger.debug('✅ Booking found', {
        bookingId: booking.id,
        paymentId: booking.payment.id,
        professionalId: booking.professionalId,
      });

      const payment = booking.payment;

      // Mapear status de MP a nuestros status
      let newStatus: PaymentStatus;
      switch (mpPayment.status) {
        case 'approved':
          newStatus = PaymentStatus.COMPLETED;
          break;
        case 'pending':
          newStatus = PaymentStatus.PENDING;
          break;
        case 'rejected':
        case 'cancelled':
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
            status: 'WAITING_FOR_PROFESSIONAL',
          },
        });

        this.logger.log('✅ Booking updated to WAITING_FOR_PROFESSIONAL', {
          booking_id: bookingId,
          professional_id: booking.professionalId,
        });

        // Crear notificación para el profesional
        await this._prisma.notification.create({
          data: {
            userId: booking.professional.userId, // Notificar al usuario del profesional
            type: 'BOOKING_REQUEST',
            title: 'Nueva solicitud de consulta',
            message: `Tienes una nueva solicitud de consulta pagada. El cliente ya realizó el pago de $${payment.amount}.`,
            payload: {
              bookingId: booking.id,
              amount: payment.amount.toString(),
              paymentId: payment.id,
              clientId: booking.clientId,
            },
          },
        });

        this.logger.log('✅ Notification created for professional', {
          professional_user_id: booking.professional.userId,
          booking_id: bookingId,
        });

        // TODO: Enviar email al profesional
        // await this.emailService.sendBookingRequestEmail(booking);

        await this.processApprovedPayment(payment, mpPayment);
      }

      this.logger.log('✅ Payment notification processed', {
        payment_id: payment.id,
        booking_id: bookingId,
        new_status: newStatus,
        mp_status: mpPayment.status,
      });
    } catch (error) {
      this.logger.error('❌ Error in processPaymentNotification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        payment_id: mpPayment.id,
        external_reference: mpPayment.external_reference,
      });
      throw error;
    }
  }

  private async processMerchantOrderNotification(merchantOrder: MPMerchantOrderResponse) {
    this.logger.log('📋 Processing merchant order notification', {
      order_id: merchantOrder.id,
      preference_id: merchantOrder.preference_id,
      payments_count: merchantOrder.payments?.length || 0,
    });

    // Aquí puedes procesar órdenes de merchant si necesitas lógica específica
    // Por ejemplo, para manejar pagos parciales o múltiples pagos
  }

  private async processApprovedPayment(
    payment: { id: string; metadata: unknown },
    mpPayment: MPPaymentResponse,
  ) {
    this.logger.log('🎉 Processing approved marketplace payment', {
      payment_id: payment.id,
      amount: mpPayment.transaction_amount,
      fee_details: mpPayment.fee_details,
    });

    try {
      // Calcular y guardar fees reales de MP
      const mpFees =
        mpPayment.fee_details?.reduce(
          (total: number, fee: { amount: number }) => total + fee.amount,
          0,
        ) || 0;

      // Actualizar con fees reales
      await this._prisma.payment.update({
        where: { id: payment.id },
        data: {
          gatewayFees: new Decimal(mpFees),
          netAmount: new Decimal(mpPayment.transaction_amount).sub(new Decimal(mpFees)),
          metadata: {
            ...(payment.metadata && typeof payment.metadata === 'object'
              ? (payment.metadata as Record<string, unknown>)
              : {}),
            mp_fees: mpFees,
            mp_transaction_amount: mpPayment.transaction_amount,
            processed_at: new Date().toISOString(),
          },
        },
      });

      this.logger.log('✅ Approved payment processed with real fees', {
        payment_id: payment.id,
        mp_fees: mpFees,
        net_amount: mpPayment.transaction_amount - mpFees,
      });
    } catch (error) {
      this.logger.error('❌ Error processing approved payment', error);
      throw error;
    }
  }

  async getPayment(paymentId: string) {
    this.logger.debug(`Getting payment ${paymentId}`);

    // Intentar buscar por CUID primero, luego por paymentId de MercadoPago
    let payment = await this._prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        events: {
          orderBy: { createdAt: 'desc' },
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

    // Si no lo encuentra por CUID, buscar por paymentId de MercadoPago
    if (!payment) {
      this.logger.debug(`Payment not found by CUID, trying by MercadoPago payment ID`);
      payment = await this._prisma.payment.findFirst({
        where: {
          OR: [{ paymentId: paymentId }, { gatewayPaymentId: paymentId }],
        },
        include: {
          events: {
            orderBy: { createdAt: 'desc' },
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
    }

    if (!payment) {
      throw new BadRequestException(`Payment ${paymentId} not found`);
    }

    this.logger.debug(
      `✅ Payment found: ${payment.id} (MP ID: ${payment.paymentId || payment.gatewayPaymentId})`,
    );
    return payment;
  }

  /**
   * Obtener pago usando los parámetros que MercadoPago envía en la URL de retorno
   * Busca por: payment_id, external_reference (booking ID), o preference_id
   */
  async getPaymentByMPParams(params: {
    payment_id?: string;
    collection_id?: string;
    external_reference?: string;
    preference_id?: string;
  }) {
    this.logger.debug(`🔍 Getting payment by MP return params`, params);

    // Construir condiciones de búsqueda
    const whereConditions: Array<
      | { paymentId: string }
      | { gatewayPaymentId: string }
      | { preferenceId: string }
      | { booking: { id: string } }
    > = [];

    // 1. Buscar por payment_id o collection_id
    if (params.payment_id) {
      whereConditions.push(
        { paymentId: params.payment_id },
        { gatewayPaymentId: params.payment_id },
      );
    }
    if (params.collection_id && params.collection_id !== params.payment_id) {
      whereConditions.push(
        { paymentId: params.collection_id },
        { gatewayPaymentId: params.collection_id },
      );
    }

    // 2. Buscar por preference_id
    if (params.preference_id) {
      whereConditions.push({ preferenceId: params.preference_id });
    }

    // 3. Buscar por external_reference (booking ID)
    if (params.external_reference) {
      whereConditions.push({
        booking: {
          id: params.external_reference,
        },
      });
    }

    if (whereConditions.length === 0) {
      throw new BadRequestException('No valid search parameters provided');
    }

    const payment = await this._prisma.payment.findFirst({
      where: {
        OR: whereConditions,
      },
      include: {
        events: {
          orderBy: { createdAt: 'desc' },
          take: 10,
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
      this.logger.warn(`Payment not found with MP params`, params);
      throw new BadRequestException(
        `Payment not found with provided parameters: ${JSON.stringify(params)}`,
      );
    }

    this.logger.log(
      `✅ Payment found by MP params: ${payment.id} (MP ID: ${payment.paymentId || payment.gatewayPaymentId})`,
    );
    return payment;
  }

  /**
   * TESTING ONLY: Crear booking + payment + preferencia SIMPLE sin split payments
   * Usar SOLO para testing en sandbox cuando split_payments falla
   */
  async createSimplePreference(request: {
    clientId: string;
    professionalId: string;
    scheduledAt: string;
    duration?: number;
    price: number;
    notes?: string;
    title: string;
    description: string;
    payerEmail?: string;
    backUrls?: {
      success: string;
      failure: string;
      pending: string;
    };
  }) {
    this.logger.log('🧪 Creating booking + simple preference (NO split payments)', {
      professional_id: request.professionalId,
      client_id: request.clientId,
      price: request.price,
    });

    try {
      // PASO 1: Verificar que el profesional existe
      const professional = await this._prisma.professionalProfile.findUnique({
        where: { id: request.professionalId },
        select: {
          id: true,
          name: true,
          pricePerSession: true,
          isActive: true,
        },
      });

      if (!professional) {
        throw new BadRequestException(`Professional ${request.professionalId} not found`);
      }

      if (!professional.isActive) {
        throw new BadRequestException(`Professional ${request.professionalId} is not active`);
      }

      // PASO 2: Verificar que el cliente existe
      const client = await this._prisma.user.findUnique({
        where: { id: request.clientId },
        select: { id: true, email: true, name: true },
      });

      if (!client) {
        throw new BadRequestException(`Client ${request.clientId} not found`);
      }

      // PASO 3: Generar jitsiRoom único
      const { v4: uuidv4 } = await import('uuid');
      const jitsiRoom = `${professional.id.slice(-8)}-${uuidv4().split('-')[0]}`;

      // PASO 4: Crear el Booking
      const booking = await this._prisma.booking.create({
        data: {
          clientId: request.clientId,
          professionalId: request.professionalId,
          scheduledAt: new Date(request.scheduledAt),
          duration: request.duration || 60,
          price: request.price,
          notes: request.notes,
          status: 'PENDING_PAYMENT',
          jitsiRoom,
          meetingStatus: 'PENDING',
        },
        include: {
          client: { select: { id: true, email: true, name: true } },
          professional: {
            select: {
              id: true,
              name: true,
              email: true,
              user: { select: { email: true } },
            },
          },
        },
      });

      this.logger.log('✅ Booking created', { booking_id: booking.id });

      // PASO 5: Crear Payment record SIN split
      const payment = await this._prisma.payment.create({
        data: {
          amount: request.price,
          netAmount: request.price, // Todo el monto (sin comisión por ahora)
          platformFee: 0, // Sin comisión en modo testing
          currency: 'ARS',
          status: PaymentStatus.PENDING,
          payerEmail: request.payerEmail || client.email,
          metadata: {
            type: 'simple_test',
            bookingId: booking.id,
            clientId: client.id,
            professionalId: professional.id,
            note: 'Simple preference without split payments - for testing only',
          },
        },
      });

      this.logger.log('✅ Payment record created', { payment_id: payment.id });

      // PASO 6: Vincular payment con booking
      await this._prisma.booking.update({
        where: { id: booking.id },
        data: { paymentId: payment.id },
      });

      // PASO 7: Crear preferencia de MercadoPago
      const mpPreference = {
        items: [
          {
            title: request.title,
            quantity: 1,
            unit_price: request.price,
            description: request.description,
          },
        ],
        external_reference: booking.id, // Usar booking.id como referencia
        back_urls: request.backUrls,
        auto_return: 'approved',
        notification_url: `${process.env.APP_URL}/api/payments/webhook`,

        // Configuración permisiva para sandbox
        payment_methods: {
          installments: 12,
          default_installments: 1,
          // NO excluir nada para máxima compatibilidad
        },

        // Datos del pagador
        payer: {
          email: request.payerEmail || client.email || 'test_user@test.com',
          name: client.name?.split(' ')[0] || 'Test',
          surname: client.name?.split(' ')[1] || 'User',
          identification: {
            type: 'DNI',
            number: '12345678',
          },
        },

        statement_descriptor: 'PROFESIONAL',
      };

      const mpResponse = await this._mercadoPagoService.createPreference(mpPreference);

      // PASO 8: Actualizar payment con preferenceId
      await this._prisma.payment.update({
        where: { id: payment.id },
        data: {
          preferenceId: mpResponse.id,
        },
      });

      this.logger.log('✅ Simple preference created successfully', {
        booking_id: booking.id,
        payment_id: payment.id,
        preference_id: mpResponse.id,
        init_point: mpResponse.init_point,
      });

      return {
        id: mpResponse.id,
        init_point: mpResponse.init_point,
        sandbox_init_point: mpResponse.sandbox_init_point,
        external_reference: booking.id,
        booking_id: booking.id,
        payment_id: payment.id,
        amount: request.price,
        booking_details: {
          id: booking.id,
          scheduledAt: booking.scheduledAt,
          duration: booking.duration,
          jitsiRoom: booking.jitsiRoom,
          status: booking.status,
          client: booking.client,
          professional: {
            id: booking.professional.id,
            name: booking.professional.name,
          },
        },
      };
    } catch (error) {
      this.logger.error('❌ Error creating simple preference with booking', error);
      throw error;
    }
  }

  /**
   * STEP 2: Crear preferencia de marketplace con split payments
   */
  async createMarketplacePreference(
    request: MarketplacePreferenceRequest,
  ): Promise<MarketplacePreferenceResponse> {
    this.logger.log('🏪 Creating marketplace preference with split payments', {
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

    this.logger.debug('💰 Split calculation', {
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
        currency: 'ARS',
        status: PaymentStatus.PENDING,
        payerEmail: request.payerEmail,
        metadata: {
          type: 'marketplace_split',
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
      marketplace: 'PROFESIONAL-MARKETPLACE',
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
      auto_return: request.autoReturn || 'approved',
      notification_url: `${process.env.APP_URL}/api/payments/webhook`,

      // Configuración de métodos de pago
      payment_methods: {
        installments: request.maxInstallments || 12,
        default_installments: 1,
        // NO excluir métodos en sandbox para que funcionen las tarjetas de prueba
      },

      // Información del pagador (mejora tasa de aprobación en sandbox)
      payer: request.payerEmail
        ? {
            email: request.payerEmail,
            name: 'User',
            surname: 'Test',
          }
        : {
            email: 'test_user@test.com',
            name: 'Test',
            surname: 'User',
          },

      // Statement descriptor (aparece en extracto bancario)
      statement_descriptor: 'PROFESIONAL',
    };

    try {
      // Crear preferencia en MP
      const mpResponse = await this._mercadoPagoService.createPreference(mpPreference);

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

      this.logger.log('✅ Marketplace preference created successfully', {
        preference_id: response.id,
        payment_id: payment.id,
        init_point: response.init_point,
        marketplace_fee: response.marketplace_fee,
      });

      return response;
    } catch (error) {
      this.logger.error('❌ Error creating marketplace preference', error);

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
    this.logger.log('🧪 Processing test card payment', {
      booking_id: cardData.bookingId,
      amount: cardData.amount,
      card_mask: `****-****-****-${cardData.cardNumber.slice(-4)}`,
    });

    // Validar que sea tarjeta de prueba
    const testCards = [
      '5031755734530604', // Visa aprobada
      '4509953566233704', // Mastercard aprobada
      '4774461290010078', // Visa rechazada
    ];

    if (!testCards.includes(cardData.cardNumber)) {
      throw new BadRequestException(
        `Tarjeta ${
          cardData.cardNumber
        } no es una tarjeta de prueba válida. Use: ${testCards.join(', ')}`,
      );
    }

    // Simular resultado según tarjeta
    const isApproved = ['5031755734530604', '4509953566233704'].includes(cardData.cardNumber);

    // Crear payment record
    const payment = await this._prisma.payment.create({
      data: {
        amount: cardData.amount,
        netAmount: cardData.amount, // For test cards, assume full amount
        currency: 'ARS',
        status: isApproved ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
        payerEmail: cardData.payerEmail,
        paymentId: cardData.cardNumber.startsWith('5') ? 'master' : 'visa', // Use paymentId field for method type
        metadata: {
          type: 'test_card',
          bookingId: cardData.bookingId, // Store bookingId in metadata
          card_mask: `****-****-****-${cardData.cardNumber.slice(-4)}`,
          test_result: isApproved ? 'approved' : 'rejected',
          cardholder: cardData.cardHolderName,
        },
      },
    });

    this.logger.log(`✅ Test card payment ${isApproved ? 'approved' : 'rejected'}`, {
      payment_id: payment.id,
      status: payment.status,
      amount: payment.amount,
    });

    return {
      payment_id: payment.id,
      status: payment.status,
      amount: payment.amount,
      approved: isApproved,
      message: isApproved
        ? 'Pago de prueba aprobado exitosamente'
        : 'Pago de prueba rechazado (simulado)',
    };
  }
}
