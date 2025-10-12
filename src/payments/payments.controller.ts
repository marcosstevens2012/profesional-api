import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CreatePreferenceDto } from './dto/create-preference.dto';
import { TestCardDto, WebhookNotificationDto } from './dto/webhook.dto';
import { MercadoPagoService } from './mercadopago.service';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly _paymentsService: PaymentsService,
    private readonly _mercadoPagoService: MercadoPagoService,
  ) {}

  // ===== RUTAS ESPECÍFICAS PRIMERO =====

  @Post('mp/preference')
  @ApiOperation({
    summary: 'Crear preferencia de pago en MercadoPago',
    description: `Crea una preferencia de pago en MercadoPago para iniciar el checkout.
    
**Características:**
- ✅ Soporte para modo Sandbox (TEST) y Producción
- ✅ Configuración automática según entorno
- ✅ Información del pagador mejora tasa de aprobación
- ✅ URLs de retorno configurables
- ✅ Soporte para cuotas (hasta 12)

**Notas importantes:**
- En localhost, \`auto_return\` está deshabilitado (restricción de MercadoPago)
- Usar \`sandbox_init_point\` en modo TEST
- El \`statement_descriptor\` aparece en el extracto bancario`,
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiHeader({
    name: 'authorization',
    description: 'Token de autorización (opcional para esta versión)',
    required: false,
  })
  @ApiBody({
    type: CreatePreferenceDto,
    description: 'Datos para crear la preferencia de pago',
    examples: {
      basic: {
        summary: 'Ejemplo básico',
        value: {
          title: 'Consulta Psicológica',
          amount: 25000,
          professionalSlug: 'dr-juan-perez',
        },
      },
      complete: {
        summary: 'Ejemplo completo con datos del pagador',
        value: {
          title: 'Consulta Psicológica',
          amount: 25000,
          professionalSlug: 'dr-juan-perez',
          external_reference: 'consultation_123',
          payerEmail: 'cliente@example.com',
          payerName: 'María',
          payerSurname: 'González',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Preferencia creada exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        preference_id: { type: 'string', example: '1234567890-abc123-def456' },
        init_point: {
          type: 'string',
          example: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...',
        },
        sandbox_init_point: {
          type: 'string',
          example: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=...',
        },
        external_reference: { type: 'string', example: 'consultation_dr-juan-perez_1234567890' },
        auto_return_enabled: { type: 'boolean', example: false },
        back_urls: {
          type: 'object',
          properties: {
            success: { type: 'string' },
            failure: { type: 'string' },
            pending: { type: 'string' },
          },
        },
        metadata: {
          type: 'object',
          properties: {
            amount: { type: 'number', example: 25000 },
            professional_slug: { type: 'string', example: 'dr-juan-perez' },
            is_sandbox: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Error en la validación de datos o configuración',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Error creating preference: Invalid amount' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor o de MercadoPago',
  })
  async createPreference(
    @Body() body: CreatePreferenceDto,
    @Headers('authorization') authHeader: string,
  ) {
    try {
      console.log('🔑 Auth Header received:', authHeader?.substring(0, 20) + '...');
      console.log('📦 Body received:', JSON.stringify(body, null, 2));

      // Validate MercadoPago configuration
      if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
        this.logger.error('❌ MERCADOPAGO_ACCESS_TOKEN not configured');
        throw new BadRequestException('MercadoPago not configured. Please contact support.');
      }

      // Extract data from the request
      const { title, amount, professionalSlug, external_reference } = body;
      console.log('👨‍⚕️ Professional slug:', professionalSlug);
      console.log('💰 Amount:', amount);

      if (!professionalSlug) {
        throw new BadRequestException('Professional slug is required');
      }
      if (!amount || amount <= 0) {
        throw new BadRequestException('Amount is required and must be greater than 0');
      }

      // Define base URL (use environment variable in production)
      const baseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';

      if (!process.env.FRONTEND_BASE_URL) {
        this.logger.warn('⚠️  FRONTEND_BASE_URL not set, using default: http://localhost:3000');
      }

      console.log('🌐 Frontend base URL:', baseUrl);

      // Construct back URLs
      const backUrls = {
        success: `${baseUrl}/profesionales/${professionalSlug}/pago/exito`,
        failure: `${baseUrl}/profesionales/${professionalSlug}/pago/error`,
        pending: `${baseUrl}/profesionales/${professionalSlug}/pago/pendiente`,
      };

      console.log('🔧 Constructed Back URLs:', JSON.stringify(backUrls, null, 2));

      // Transform data to MercadoPago format
      const mpPreferenceData: {
        items: Array<{
          title: string;
          quantity: number;
          unit_price: number;
          category_id: string;
          description: string;
        }>;
        external_reference: string;
        back_urls: {
          success: string;
          failure: string;
          pending: string;
        };
        payment_methods: {
          installments: number;
          default_installments: number;
          excluded_payment_methods?: Array<{ id: string }>;
          excluded_payment_types?: Array<{ id: string }>;
        };
        payer: {
          email: string;
          name: string;
          surname: string;
        };
        statement_descriptor: string;
        auto_return?: string;
      } = {
        items: [
          {
            title: title || 'Consulta con Profesional',
            quantity: 1,
            unit_price: Number(amount),
            category_id: 'services',
            description: `Consulta profesional con ${professionalSlug}`,
          },
        ],
        external_reference: external_reference || `consultation_${professionalSlug}_${Date.now()}`,
        back_urls: backUrls,

        // Configuración de métodos de pago (importante para sandbox)
        payment_methods: {
          // Cuotas permitidas
          installments: 12,
          default_installments: 1,

          // En sandbox: NO excluir métodos de pago para permitir tarjetas de prueba
          // En producción: Se pueden excluir métodos específicos si es necesario
          // excluded_payment_methods: [{ id: 'amex' }], // Ejemplo: excluir American Express
          // excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }], // Ejemplo: excluir efectivo

          // Métodos de pago disponibles en Argentina:
          // - credit_card: Tarjetas de crédito (Visa, Mastercard, Amex, etc.)
          // - debit_card: Tarjetas de débito
          // - ticket: Efectivo (Rapipago, Pago Fácil)
          // - bank_transfer: Transferencia bancaria
          // - account_money: Dinero en cuenta de MercadoPago
          // - digital_currency: Monedas digitales
          // - digital_wallet: Billeteras digitales
          // - prepaid_card: Tarjetas prepagas

          // Para habilitar todos los métodos, simplemente no incluir excluded_payment_*
        },

        // Información del pagador (recomendado para mejorar tasa de aprobación)
        payer: {
          email: body.payerEmail || 'test_user@test.com',
          name: body.payerName || 'Test',
          surname: body.payerSurname || 'User',
        },

        // Statement descriptor (aparece en extracto bancario - máx 11 caracteres)
        statement_descriptor: 'PROFESIONAL',
      };

      // IMPORTANTE: MercadoPago NO acepta localhost en back_urls cuando se usa auto_return
      // Solo agregar auto_return si las URLs NO son localhost
      const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');

      if (!isLocalhost) {
        mpPreferenceData.auto_return = 'approved';
        console.log('✅ auto_return enabled (production URLs)');
      } else {
        // En localhost, necesitamos que el usuario haga clic en el botón de volver
        // Agregamos esto para mejorar la UX
        console.log('⚠️  auto_return disabled (localhost URLs - MercadoPago restriction)');
        console.log('💡 User will need to click "Volver al sitio" button after payment');
      }

      console.log('🔧 Full MP Preference Data:', JSON.stringify(mpPreferenceData, null, 2));

      // REAL MERCADOPAGO INTEGRATION
      const preference = await this._mercadoPagoService.createPreference(mpPreferenceData);

      console.log('✅ Real preference created successfully:', preference);

      // Determinar qué URL de pago usar (sandbox para TEST tokens, producción para otros)
      const isSandbox = this.isSandboxEnvironment();
      const paymentUrl = isSandbox ? preference.sandbox_init_point : preference.init_point;

      return {
        success: true,
        preference_id: preference.id,
        init_point: paymentUrl,
        sandbox_init_point: preference.sandbox_init_point,
        external_reference: preference.external_reference,
        auto_return_enabled: !isLocalhost,
        back_urls: mpPreferenceData.back_urls,
        // Info adicional para el frontend
        metadata: {
          amount: Number(amount),
          professional_slug: professionalSlug,
          is_sandbox: isSandbox,
        },
      };
    } catch (error: unknown) {
      // Log detailed error information
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error occurred while creating payment preference';

      this.logger.error('❌ Error creating MercadoPago preference:', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        professionalSlug: body?.professionalSlug,
      });

      // Provide user-friendly error messages
      throw new BadRequestException(`Error creating preference: ${errorMessage}`);
    }
  }

  private isSandboxEnvironment(): boolean {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
    return accessToken.startsWith('TEST-');
  }

  @Post('webhook')
  @Public()
  @ApiOperation({
    summary: 'Webhook de MercadoPago',
    description: `Recibe notificaciones de MercadoPago sobre cambios en el estado de los pagos.

**Tipos de notificaciones:**
- \`payment\`: Notificación de cambio de estado de pago
- \`merchant_order\`: Notificación de orden de merchant
- \`preference\`: Notificación de preferencia

**Estados de pago:**
- \`approved\`: Pago aprobado
- \`pending\`: Pago pendiente
- \`rejected\`: Pago rechazado
- \`cancelled\`: Pago cancelado

**Nota:** Este endpoint es llamado automáticamente por MercadoPago.`,
  })
  @ApiBody({
    description: 'Datos del webhook de MercadoPago',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '12345' },
        type: {
          type: 'string',
          example: 'payment',
          enum: ['payment', 'merchant_order', 'preference'],
        },
        action: { type: 'string', example: 'payment.updated' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '67890' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook procesado correctamente',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        processed: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Error al procesar webhook',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'error' },
        processed: { type: 'boolean', example: false },
        error: { type: 'string', example: 'Payment not found' },
      },
    },
  })
  async handleWebhook(@Body() webhookData: WebhookNotificationDto) {
    this.logger.log('📨 Received MP webhook', { type: webhookData.type });

    try {
      await this._paymentsService.handleWebhook(webhookData);
      return { status: 'ok', processed: true };
    } catch (error) {
      this.logger.error('❌ Error processing webhook', error);
      return {
        status: 'error',
        processed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Public()
  @Get('config-check')
  @ApiOperation({
    summary: 'Verificar configuración de MercadoPago',
    description: `Verifica la configuración actual de MercadoPago y el entorno.

**Información retornada:**
- URL del frontend configurada
- Si está en localhost o producción
- Si auto_return está habilitado
- Modo sandbox o producción
- Si el token de acceso está configurado
- Recomendaciones según el entorno

**Uso:** Útil para debugging y verificar la configuración antes de crear pagos.`,
  })
  @ApiProduces('application/json')
  @ApiResponse({
    status: 200,
    description: 'Configuración de MercadoPago',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        config: {
          type: 'object',
          properties: {
            frontend_base_url: { type: 'string', example: 'http://localhost:3000' },
            is_localhost: { type: 'boolean', example: true },
            auto_return_enabled: { type: 'boolean', example: false },
            is_sandbox: { type: 'boolean', example: true },
            has_access_token: { type: 'boolean', example: true },
            token_type: {
              type: 'string',
              example: 'TEST (Sandbox)',
              enum: ['TEST (Sandbox)', 'PRODUCTION'],
            },
            recommended_action: {
              type: 'string',
              example:
                '⚠️  En localhost - Usuario debe hacer clic en "Volver al sitio" después del pago',
            },
          },
        },
      },
    },
  })
  async checkMercadoPagoConfig() {
    const baseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
    const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
    const isSandbox = this.isSandboxEnvironment();
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || '';

    return {
      success: true,
      config: {
        frontend_base_url: baseUrl,
        is_localhost: isLocalhost,
        auto_return_enabled: !isLocalhost,
        is_sandbox: isSandbox,
        has_access_token: !!accessToken,
        token_type: accessToken.startsWith('TEST-') ? 'TEST (Sandbox)' : 'PRODUCTION',
        recommended_action: isLocalhost
          ? '⚠️  En localhost - Usuario debe hacer clic en "Volver al sitio" después del pago'
          : '✅ En producción - Redirección automática habilitada',
      },
    };
  }

  @Post('test-cards')
  @ApiOperation({
    summary: 'Información de tarjetas de prueba',
    description: `Retorna información sobre las tarjetas de prueba disponibles en MercadoPago.

**Tarjetas disponibles:**

**✅ APROBADAS:**
- Mastercard: \`5031 7557 3453 0604\` - CVV: 123 - Nombre: APRO
- Visa: \`4509 9535 6623 3704\` - CVV: 123 - Nombre: APRO

**❌ RECHAZADAS:**
- Visa: \`4774 4612 9001 0078\` - CVV: 123

**⏸️ PENDIENTES:**
- Mastercard: \`5031 4332 1540 6351\` - CVV: 123

**Nota:** Solo funciona en modo Sandbox (TEST).`,
  })
  @ApiBody({ type: TestCardDto })
  @ApiResponse({
    status: 200,
    description: 'Información de tarjetas de prueba',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Test cards information' },
        data: {
          type: 'object',
          properties: {
            cards: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  number: { type: 'string', example: '5031755734530604' },
                  cvv: { type: 'string', example: '123' },
                  exp: { type: 'string', example: '11/30' },
                  status: { type: 'string', example: 'approved' },
                },
              },
            },
            selectedCard: { type: 'string', example: '5031755734530604' },
            amount: { type: 'number', example: 1000 },
          },
        },
      },
    },
  })
  async testWithCards(@Body() cardDto: TestCardDto) {
    this.logger.log('🧪 Testing payment with test cards');

    const testCards = [
      {
        number: '5031755734530604',
        cvv: '123',
        exp: '11/30',
        status: 'approved',
      },
      {
        number: '4013540682746260',
        cvv: '123',
        exp: '11/30',
        status: 'rejected',
      },
      {
        number: '5508050001234567',
        cvv: '123',
        exp: '11/30',
        status: 'pending',
      },
    ];

    return {
      success: true,
      message: 'Test cards information',
      data: {
        cards: testCards,
        selectedCard: cardDto.cardNumber || testCards[0].number,
        amount: cardDto.amount || 1000,
      },
    };
  }

  // ===== RUTAS PARAMÉTRICAS AL FINAL =====

  @Get('payment/:id')
  @ApiOperation({
    summary: 'Obtener información de un pago',
    description: `Obtiene los detalles completos de un pago por su ID.

**Información incluida:**
- Estado del pago
- Monto y comisiones
- Datos del pagador
- Información del profesional y cliente
- Historial de eventos del pago
- Datos de MercadoPago

**Estados posibles:**
- \`PENDING\`: Pendiente de pago
- \`COMPLETED\`: Pago completado exitosamente
- \`FAILED\`: Pago fallido o rechazado
- \`CANCELLED\`: Pago cancelado`,
  })
  @ApiParam({
    name: 'id',
    description: 'ID del pago (CUID)',
    example: 'clx1a2b3c4d5e6f7g8h9i0j1k',
  })
  @ApiResponse({
    status: 200,
    description: 'Información del pago encontrada',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clx1a2b3c4d5e6f7g8h9i0j1k' },
            provider: { type: 'string', example: 'MERCADOPAGO' },
            preferenceId: { type: 'string', example: '1234567890-abc123-def456' },
            paymentId: { type: 'string', example: '67890' },
            status: { type: 'string', example: 'COMPLETED' },
            amount: { type: 'number', example: 25000 },
            fee: { type: 'number', example: 0 },
            gatewayFees: { type: 'number', example: 1500 },
            platformFee: { type: 'number', example: 5000 },
            netAmount: { type: 'number', example: 18500 },
            currency: { type: 'string', example: 'ARS' },
            payerEmail: { type: 'string', example: 'cliente@example.com' },
            paidAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            booking: { type: 'object', description: 'Información de la reserva asociada' },
            events: {
              type: 'array',
              description: 'Historial de eventos del pago',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Pago no encontrado',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Payment not found' },
        error: { type: 'string', example: 'Payment with id clx1a2b3c4d5e6f7g8h9i0j1k not found' },
      },
    },
  })
  async getPayment(@Param('id') id: string) {
    this.logger.log(`Getting payment ${id}`);

    try {
      const payment = await this._paymentsService.getPayment(id);
      return {
        success: true,
        data: payment,
      };
    } catch (error) {
      this.logger.error(`Error getting payment ${id}`, error);
      return {
        success: false,
        message: 'Payment not found',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
