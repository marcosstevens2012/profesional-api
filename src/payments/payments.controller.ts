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
import { ApiTags } from '@nestjs/swagger';
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
  async createPreference(@Body() body: any, @Headers('authorization') authHeader: string) {
    try {
      console.log('🔑 Auth Header received:', authHeader?.substring(0, 20) + '...');
      console.log('📦 Body received:', JSON.stringify(body, null, 2));

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

      console.log('🌐 Frontend base URL:', baseUrl);

      // Construct back URLs
      const backUrls = {
        success: `${baseUrl}/profesionales/${professionalSlug}/pago/exito`,
        failure: `${baseUrl}/profesionales/${professionalSlug}/pago/error`,
        pending: `${baseUrl}/profesionales/${professionalSlug}/pago/pendiente`,
      };

      console.log('🔧 Constructed Back URLs:', JSON.stringify(backUrls, null, 2));

      // Transform data to MercadoPago format
      const mpPreferenceData: any = {
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
        payment_methods: {
          installments: 12,
        },
      };

      // IMPORTANTE: MercadoPago NO acepta localhost en back_urls cuando se usa auto_return
      // Solo agregar auto_return si las URLs NO son localhost
      const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');

      if (!isLocalhost) {
        mpPreferenceData.auto_return = 'approved';
        console.log('✅ auto_return enabled (production URLs)');
      } else {
        console.log('⚠️  auto_return disabled (localhost URLs - MercadoPago restriction)');
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
    } catch (error: any) {
      console.error('❌ Error creating MercadoPago preference:', error);
      throw new BadRequestException(
        `Error creating preference: ${error?.message || 'Unknown error'}`,
      );
    }
  }

  private isSandboxEnvironment(): boolean {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
    return accessToken.startsWith('TEST-');
  }

  @Post('webhook')
  async handleWebhook(@Body() webhookData: any) {
    this.logger.log('📨 Received MP webhook', { type: webhookData.type });

    try {
      await this._paymentsService.handleWebhook(webhookData, '');
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

  @Post('test-cards')
  async testWithCards(@Body() cardDto: any) {
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
