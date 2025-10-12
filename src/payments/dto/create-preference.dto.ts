import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
