import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export interface WebhookNotificationDto {
  id: string;
  type: string;
  action?: string;
  data: {
    id: string;
  };
}

export class TestCardDto {
  @ApiProperty({
    description: 'ID de la reserva/booking',
    example: 'clx1a2b3c4d5e6f7g8h9i0j1k',
  })
  @IsString()
  @IsNotEmpty()
  bookingId!: string;

  @ApiProperty({
    description: 'Monto del pago',
    example: 25000,
    minimum: 1,
  })
  @IsNumber()
  amount!: number;

  @ApiProperty({
    description: 'Número de tarjeta de prueba (16 dígitos sin espacios)',
    example: '5031755734530604',
    minLength: 15,
    maxLength: 16,
  })
  @IsString()
  @IsNotEmpty()
  cardNumber!: string;

  @ApiProperty({
    description: 'Mes de vencimiento (MM)',
    example: '12',
    minLength: 2,
    maxLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  expirationMonth!: string;

  @ApiProperty({
    description: 'Año de vencimiento (YY)',
    example: '25',
    minLength: 2,
    maxLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  expirationYear!: string;

  @ApiProperty({
    description: 'Código de seguridad CVV',
    example: '123',
    minLength: 3,
    maxLength: 4,
  })
  @IsString()
  @IsNotEmpty()
  cvv!: string;

  @ApiProperty({
    description: 'Nombre del titular de la tarjeta',
    example: 'APRO',
  })
  @IsString()
  @IsNotEmpty()
  cardHolderName!: string;

  @ApiPropertyOptional({
    description: 'Email del pagador',
    example: 'test@example.com',
    format: 'email',
  })
  @IsEmail()
  @IsOptional()
  payerEmail?: string;
}
