import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePreferenceDto {
  @ApiProperty({
    description: 'Título del servicio o consulta',
    example: 'Consulta Psicológica',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Monto en pesos argentinos (ARS)',
    example: 25000,
    minimum: 1,
    type: Number,
  })
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty({
    description: 'Slug del profesional (URL-friendly)',
    example: 'dr-juan-perez',
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  professionalSlug!: string;

  @ApiPropertyOptional({
    description:
      'Referencia externa única para el pago (se genera automáticamente si no se provee)',
    example: 'consultation_dr-juan-perez_1234567890',
  })
  @IsString()
  @IsOptional()
  external_reference?: string;

  @ApiPropertyOptional({
    description: 'Email del pagador (mejora la tasa de aprobación en MercadoPago)',
    example: 'cliente@example.com',
    format: 'email',
  })
  @IsEmail()
  @IsOptional()
  payerEmail?: string;

  @ApiPropertyOptional({
    description: 'Nombre del pagador',
    example: 'Juan',
  })
  @IsString()
  @IsOptional()
  payerName?: string;

  @ApiPropertyOptional({
    description: 'Apellido del pagador',
    example: 'García',
  })
  @IsString()
  @IsOptional()
  payerSurname?: string;
}

export class CreateSimplePreferenceDto {
  @ApiProperty({
    description: 'ID del cliente (usuario que hace la reserva)',
    example: 'user_abc123',
  })
  @IsString()
  @IsNotEmpty()
  clientId!: string;

  @ApiProperty({
    description: 'ID del perfil profesional',
    example: 'prof_xyz789',
  })
  @IsString()
  @IsNotEmpty()
  professionalId!: string;

  @ApiProperty({
    description: 'Fecha y hora de la consulta (ISO 8601)',
    example: '2025-10-20T15:00:00Z',
  })
  @IsString()
  @IsNotEmpty()
  scheduledAt!: string;

  @ApiPropertyOptional({
    description: 'Duración de la consulta en minutos',
    example: 60,
    default: 60,
  })
  @IsNumber()
  @IsOptional()
  @Min(15)
  duration?: number;

  @ApiProperty({
    description: 'Precio de la consulta en ARS',
    example: 45000,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @Transform(({ obj }) => obj.price || obj.amount) // Acepta "price" o "amount"
  price!: number;

  @ApiPropertyOptional({
    description: 'Notas adicionales del cliente',
    example: 'Primera consulta, tengo dudas sobre...',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Título del servicio para MercadoPago',
    example: 'Consulta Psicológica - Dr. Juan Pérez',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({
    description: 'Descripción del servicio',
    example: 'Consulta profesional online',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Email del pagador',
    example: 'cliente@example.com',
  })
  @IsEmail()
  @IsOptional()
  payerEmail?: string;

  @ApiProperty({
    description: 'Slug del profesional (para URLs de retorno)',
    example: 'dr-juan-perez',
  })
  @IsString()
  @IsNotEmpty()
  professionalSlug!: string;
}
