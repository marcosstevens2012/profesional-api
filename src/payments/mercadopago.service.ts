import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import crypto from 'crypto';
import { firstValueFrom } from 'rxjs';
import {
  MPMerchantOrderResponse,
  MPPaymentResponse,
  MPWebhookNotification,
} from './interfaces/mp-responses.interface';

interface MercadoPagoItem {
  id?: string; // ID único del item/servicio
  title: string;
  description?: string;
  picture_url?: string; // URL de la imagen del servicio
  category_id?: string;
  quantity: number;
  currency_id?: string; // 'ARS', 'BRL', 'MXN', etc.
  unit_price: number;
}

interface MercadoPagoMarketplaceSplit {
  amount: number;
  fee_amount: number;
  collector: {
    id: number; // User ID del vendedor
  };
}

interface MercadoPagoBackUrls {
  success: string;
  failure: string;
  pending: string;
}

interface MercadoPagoPaymentMethods {
  excluded_payment_methods?: Array<{ id: string }>;
  excluded_payment_types?: Array<{ id: string }>;
  installments?: number;
  default_installments?: number;
  default_payment_method_id?: string;
}

interface MercadoPagoPayer {
  name?: string;
  surname?: string;
  email?: string;
  phone?: {
    area_code?: string;
    number?: number;
  };
  identification?: {
    type?: string; // 'CPF', 'DNI', 'CUIT', etc.
    number?: string;
  };
  address?: {
    zip_code?: string;
    street_name?: string;
    street_number?: number;
  };
  date_created?: string;
}

interface MercadoPagoShipments {
  local_pickup?: boolean;
  dimensions?: string;
  default_shipping_method?: string | null;
  free_methods?: Array<{ id: string | null }>;
  cost?: number;
  free_shipping?: boolean;
  receiver_address?: {
    zip_code?: string;
    street_name?: string;
    city_name?: string;
    state_name?: string;
    street_number?: number;
    country_name?: string;
  };
}

interface MercadoPagoDifferentialPricing {
  id: number;
}

interface MercadoPagoTrack {
  type: string; // 'google_ad', 'facebook_ad', etc.
  values: {
    conversion_id?: number;
    conversion_label?: string;
    pixel_id?: string;
  };
}

interface MercadoPagoPreference {
  items: MercadoPagoItem[];
  payer?: MercadoPagoPayer;
  payment_methods?: MercadoPagoPaymentMethods;
  shipments?: MercadoPagoShipments;
  back_urls?: MercadoPagoBackUrls;
  notification_url?: string;
  additional_info?: string;
  auto_return?: string; // 'approved', 'all'
  external_reference?: string;
  expires?: boolean;
  expiration_date_from?: string;
  expiration_date_to?: string;
  marketplace?: string;
  marketplace_fee?: number;
  split_payments?: MercadoPagoMarketplaceSplit[];
  differential_pricing?: MercadoPagoDifferentialPricing;
  tracks?: MercadoPagoTrack[];
  metadata?: Record<string, string | number | boolean>;
  statement_descriptor?: string; // Descriptor en extracto bancario (max 11 caracteres)
}

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly baseUrl: string;
  private readonly accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  private readonly webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  private readonly isSandbox: boolean;

  constructor(private readonly _httpService: HttpService) {
    // Determinar si estamos en modo sandbox
    this.isSandbox =
      process.env.MERCADOPAGO_SANDBOX === 'true' || this.accessToken?.startsWith('TEST-') || false;

    // Configurar baseUrl según el modo
    const configuredBaseUrl = process.env.MERCADOPAGO_BASE_URL || 'https://api.mercadopago.com';

    if (this.isSandbox) {
      // En sandbox, algunos endpoints necesitan /sandbox en la URL
      this.baseUrl = configuredBaseUrl;
      this.logger.warn('🧪 MERCADOPAGO SERVICE RUNNING IN SANDBOX MODE');
    } else {
      this.baseUrl = configuredBaseUrl;
      this.logger.log('🏭 MercadoPago service running in PRODUCTION mode');
    }

    this.logger.debug('MercadoPago configuration', {
      baseUrl: this.baseUrl,
      isSandbox: this.isSandbox,
      hasAccessToken: !!this.accessToken,
      hasWebhookSecret: !!this.webhookSecret,
    });
  }

  async createPreference(preference: MercadoPagoPreference) {
    // Log completo del objeto que se enviará
    console.log('📤 Full preference payload to send:', JSON.stringify(preference, null, 2));

    // Validar que si se usa auto_return, back_urls.success debe estar definida
    // NOTA: MercadoPago no acepta localhost en back_urls cuando se usa auto_return
    if (preference.auto_return && !preference.back_urls?.success) {
      const errorMsg = `Cannot use auto_return without back_urls.success. Current back_urls: ${JSON.stringify(preference.back_urls)}`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Asegurar configuración mínima para sandbox
    if (this.isSandbox) {
      this.logger.debug('🧪 Using SANDBOX mode - ensuring test-friendly configuration');

      // En sandbox, asegurar que haya payer info (mejora tasa de aprobación)
      if (!preference.payer?.email) {
        this.logger.warn('⚠️ No payer email provided - adding default for sandbox');
        preference.payer = {
          ...preference.payer,
          email: 'test_user@test.com',
          name: preference.payer?.name || 'Test',
          surname: preference.payer?.surname || 'User',
        };
      }

      // Asegurar statement_descriptor
      if (!preference.statement_descriptor) {
        preference.statement_descriptor = 'PROFESIONAL';
      }
    }

    this.logger.debug('🔥 Creating MP marketplace preference', {
      external_reference: preference.external_reference,
      marketplace_fee: preference.marketplace_fee,
      split_payments: preference.split_payments?.length || 0,
      auto_return: preference.auto_return,
      has_back_urls: !!preference.back_urls,
      back_urls_success: preference.back_urls?.success,
      is_sandbox: this.isSandbox,
      has_payer_email: !!preference.payer?.email,
    });

    try {
      const response = await firstValueFrom(
        this._httpService.post(`${this.baseUrl}/checkout/preferences`, preference, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': `${preference.external_reference}-${Date.now()}`, // Prevenir duplicados
          },
          timeout: 10000, // 10 segundos timeout
        }),
      );

      this.logger.log('✅ MP preference created successfully', {
        preference_id: response.data.id,
        collector_id: response.data.collector_id,
        external_reference: response.data.external_reference,
        init_point: response.data.init_point,
      });

      return response.data;
    } catch (error: unknown) {
      this.logger.error('❌ Error creating MP preference', {
        error: error instanceof Error ? error.message : 'Unknown error',
        preference: preference.external_reference,
      });
      throw error;
    }
  }

  async getPayment(paymentId: string): Promise<MPPaymentResponse> {
    this.logger.debug(`🔍 Getting MP payment ${paymentId}`);

    try {
      const response = await firstValueFrom(
        this._httpService.get(`${this.baseUrl}/v1/payments/${paymentId}`, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          timeout: 10000,
        }),
      );

      this.logger.log('✅ MP payment retrieved', {
        payment_id: response.data.id,
        status: response.data.status,
        status_detail: response.data.status_detail,
        transaction_amount: response.data.transaction_amount,
        collector_id: response.data.collector_id,
      });

      return response.data;
    } catch (error: unknown) {
      // Extraer detalles del error de Axios
      const errorDetails: Record<string, unknown> = {};

      if (error && typeof error === 'object') {
        const axiosError = error as {
          response?: { status: number; statusText: string; data: unknown; headers: unknown };
          request?: unknown;
          message?: string;
          code?: string;
        };

        if (axiosError.response) {
          // La petición se hizo y el servidor respondió con un código de error
          errorDetails.status = axiosError.response.status;
          errorDetails.statusText = axiosError.response.statusText;
          errorDetails.data = axiosError.response.data;
          errorDetails.headers = axiosError.response.headers;
        } else if (axiosError.request) {
          // La petición se hizo pero no hubo respuesta
          errorDetails.message = 'No response from MercadoPago API';
          errorDetails.request = 'Request made but no response received';
        } else {
          // Algo pasó al configurar la petición
          errorDetails.message = axiosError.message || 'Unknown error';
        }

        if (axiosError.code) {
          errorDetails.code = axiosError.code;
        }
      }

      this.logger.error(`❌ Error getting MP payment ${paymentId}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: errorDetails,
        url: `${this.baseUrl}/v1/payments/${paymentId}`,
        hasAccessToken: !!this.accessToken,
        accessTokenPrefix: this.accessToken?.substring(0, 15) + '...',
      });

      // Log adicional con JSON.stringify para ver TODO el contenido
      console.error('🔴 FULL ERROR DETAILS:', JSON.stringify(errorDetails, null, 2));

      throw error;
    }
  }

  async getPreference(preferenceId: string) {
    this.logger.debug(`🔍 Getting MP preference ${preferenceId}`);

    try {
      const response = await firstValueFrom(
        this._httpService.get(`${this.baseUrl}/checkout/preferences/${preferenceId}`, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`❌ Error getting MP preference ${preferenceId}`, error);
      throw error;
    }
  }

  async getMerchantOrder(merchantOrderId: string): Promise<MPMerchantOrderResponse> {
    this.logger.debug(`🔍 Getting MP merchant order ${merchantOrderId}`);

    try {
      const response = await firstValueFrom(
        this._httpService.get(`${this.baseUrl}/merchant_orders/${merchantOrderId}`, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }),
      );

      this.logger.log('✅ MP merchant order retrieved', {
        order_id: response.data.id,
        preference_id: response.data.preference_id,
        payments: response.data.payments?.length || 0,
        order_status: response.data.order_status,
      });

      return response.data;
    } catch (error) {
      this.logger.error(`❌ Error getting MP merchant order ${merchantOrderId}`, error);
      throw error;
    }
  }

  async verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
    if (!this.webhookSecret || !signature) {
      this.logger.warn('⚠️ Missing webhook secret or signature for verification');
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      const isValid = signature === `sha256=${expectedSignature}`;

      this.logger.debug('🔐 Webhook signature verification', {
        provided_signature: signature,
        expected_signature: `sha256=${expectedSignature}`,
        is_valid: isValid,
      });

      return isValid;
    } catch (error) {
      this.logger.error('❌ Error verifying webhook signature', error);
      return false;
    }
  }

  /**
   * Procesa una notificación de webhook según su tipo
   */
  async processWebhookNotification(
    notificationData: MPWebhookNotification,
  ): Promise<MPPaymentResponse | MPMerchantOrderResponse | unknown | null> {
    this.logger.log('🔔 Processing MP webhook notification', {
      id: notificationData.id,
      type: notificationData.type,
      action: notificationData.action,
    });

    switch (notificationData.type) {
      case 'payment':
        return await this.getPayment(notificationData.data.id);

      case 'merchant_order':
        return await this.getMerchantOrder(notificationData.data.id);

      case 'preference':
        return await this.getPreference(notificationData.data.id);

      default:
        this.logger.warn(`⚠️ Unknown webhook notification type: ${notificationData.type}`);
        return null;
    }
  }

  /**
   * Helper para crear una preferencia mejorada con todos los campos recomendados
   */
  async createImprovedPreference(data: {
    // Items
    serviceId: string;
    title: string;
    description?: string;
    pictureUrl?: string;
    categoryId?: string;
    amount: number;
    currencyId?: string;

    // Payer info (recomendado)
    payerEmail?: string;
    payerName?: string;
    payerSurname?: string;
    payerPhone?: string;
    payerIdentificationType?: string;
    payerIdentificationNumber?: string;

    // URLs
    backUrls: {
      success: string;
      failure: string;
      pending: string;
    };
    notificationUrl: string;

    // Payment config
    maxInstallments?: number;
    defaultInstallments?: number;
    excludedPaymentMethods?: string[];
    excludedPaymentTypes?: string[];

    // Metadata & tracking
    externalReference: string;
    metadata?: Record<string, string | number | boolean>;

    // Marketplace (opcional)
    marketplace?: string;
    marketplaceFee?: number;
    splitPayments?: MercadoPagoMarketplaceSplit[];

    // Otros
    statementDescriptor?: string;
    expirationHours?: number;
  }) {
    this.logger.debug('🔥 Creating improved MP preference', {
      service_id: data.serviceId,
      amount: data.amount,
      currency: data.currencyId || 'ARS',
      payer_email: data.payerEmail,
    });

    const preference: MercadoPagoPreference = {
      // Items con todos los campos
      items: [
        {
          id: data.serviceId,
          title: data.title,
          description: data.description,
          picture_url: data.pictureUrl,
          category_id: data.categoryId || 'services',
          quantity: 1,
          currency_id: data.currencyId || 'ARS',
          unit_price: data.amount,
        },
      ],

      // Payer info (mejora UX)
      payer: data.payerEmail
        ? {
            email: data.payerEmail,
            name: data.payerName,
            surname: data.payerSurname,
            phone: data.payerPhone
              ? {
                  number: parseInt(data.payerPhone),
                }
              : undefined,
            identification:
              data.payerIdentificationType && data.payerIdentificationNumber
                ? {
                    type: data.payerIdentificationType,
                    number: data.payerIdentificationNumber,
                  }
                : undefined,
          }
        : undefined,

      // Payment methods
      payment_methods: {
        installments: data.maxInstallments || 12,
        default_installments: data.defaultInstallments || 1,
        excluded_payment_methods: data.excludedPaymentMethods?.map((id) => ({
          id,
        })),
        excluded_payment_types: data.excludedPaymentTypes?.map((id) => ({ id })),
      },

      // URLs
      back_urls: data.backUrls,
      auto_return: 'approved',
      notification_url: data.notificationUrl,

      // Metadata
      external_reference: data.externalReference,
      metadata: data.metadata,

      // Marketplace
      marketplace: data.marketplace,
      marketplace_fee: data.marketplaceFee,
      split_payments: data.splitPayments,

      // Statement descriptor (aparece en extracto bancario)
      statement_descriptor: data.statementDescriptor || 'PROFESIONAL',

      // Expiración (opcional)
      expires: data.expirationHours ? true : false,
      expiration_date_from: data.expirationHours ? new Date().toISOString() : undefined,
      expiration_date_to: data.expirationHours
        ? new Date(Date.now() + data.expirationHours * 60 * 60 * 1000).toISOString()
        : undefined,
    };

    return this.createPreference(preference);
  }
}
