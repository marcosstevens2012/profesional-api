import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PreferenceResponseDto {
  @ApiProperty({
    description: 'Indica si la operación fue exitosa',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'ID de la preferencia de MercadoPago',
    example: '1234567890-abc123-def456',
  })
  preference_id!: string;

  @ApiProperty({
    description: 'URL de pago (production o sandbox según configuración)',
    example: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...',
  })
  init_point!: string;

  @ApiProperty({
    description: 'URL de pago para sandbox/testing',
    example: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=...',
  })
  sandbox_init_point!: string;

  @ApiProperty({
    description: 'Referencia externa del pago',
    example: 'consultation_dr-juan-perez_1234567890',
  })
  external_reference!: string;

  @ApiProperty({
    description: 'Indica si auto_return está habilitado (false en localhost)',
    example: false,
  })
  auto_return_enabled!: boolean;

  @ApiProperty({
    description: 'URLs de retorno configuradas',
    type: 'object',
    example: {
      success: 'http://localhost:3000/profesionales/dr-juan-perez/pago/exito',
      failure: 'http://localhost:3000/profesionales/dr-juan-perez/pago/error',
      pending: 'http://localhost:3000/profesionales/dr-juan-perez/pago/pendiente',
    },
  })
  back_urls!: {
    success: string;
    failure: string;
    pending: string;
  };

  @ApiProperty({
    description: 'Metadatos adicionales',
    type: 'object',
    example: {
      amount: 25000,
      professional_slug: 'dr-juan-perez',
      is_sandbox: true,
    },
  })
  metadata!: {
    amount: number;
    professional_slug: string;
    is_sandbox: boolean;
  };
}

export class ConfigCheckResponseDto {
  @ApiProperty({
    description: 'Indica si la operación fue exitosa',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Configuración actual de MercadoPago',
  })
  config!: {
    frontend_base_url: string;
    is_localhost: boolean;
    auto_return_enabled: boolean;
    is_sandbox: boolean;
    has_access_token: boolean;
    token_type: 'TEST (Sandbox)' | 'PRODUCTION';
    recommended_action: string;
  };
}

export class WebhookResponseDto {
  @ApiProperty({
    description: 'Estado del procesamiento',
    enum: ['ok', 'error'],
    example: 'ok',
  })
  status!: string;

  @ApiProperty({
    description: 'Indica si el webhook fue procesado',
    example: true,
  })
  processed!: boolean;

  @ApiPropertyOptional({
    description: 'Mensaje de error si processed es false',
    example: 'Payment not found',
  })
  error?: string;
}

export class PaymentResponseDto {
  @ApiProperty({
    description: 'Indica si la operación fue exitosa',
    example: true,
  })
  success!: boolean;

  @ApiPropertyOptional({
    description: 'Datos del pago',
  })
  data?: unknown;

  @ApiPropertyOptional({
    description: 'Mensaje descriptivo',
    example: 'Payment not found',
  })
  message?: string;

  @ApiPropertyOptional({
    description: 'Mensaje de error',
    example: 'Payment with id xyz not found',
  })
  error?: string;
}
