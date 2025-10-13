import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum MPCollectionStatus {
  APPROVED = 'approved',
  PENDING = 'pending',
  REJECTED = 'rejected',
  IN_PROCESS = 'in_process',
  IN_MEDIATION = 'in_mediation',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  CHARGED_BACK = 'charged_back',
}

/**
 * DTO para los parámetros que MercadoPago envía en la URL de retorno
 * Ejemplo: /pago/exito?payment_id=123&status=approved&external_reference=xxx&...
 */
export class MercadoPagoReturnDto {
  @ApiPropertyOptional({
    description: 'ID del pago en MercadoPago',
    example: '129194085837',
  })
  @IsOptional()
  @IsString()
  payment_id?: string;

  @ApiPropertyOptional({
    description: 'ID de la colección (generalmente igual al payment_id)',
    example: '129194085837',
  })
  @IsOptional()
  @IsString()
  collection_id?: string;

  @ApiPropertyOptional({
    description: 'Estado del pago',
    enum: MPCollectionStatus,
    example: 'approved',
  })
  @IsOptional()
  @IsEnum(MPCollectionStatus)
  status?: MPCollectionStatus;

  @ApiPropertyOptional({
    description: 'Estado de la colección',
    enum: MPCollectionStatus,
    example: 'approved',
  })
  @IsOptional()
  @IsEnum(MPCollectionStatus)
  collection_status?: MPCollectionStatus;

  @ApiPropertyOptional({
    description: 'Referencia externa (ID del booking en tu sistema)',
    example: 'cmgpcf29u0001zl01gapokal7',
  })
  @IsOptional()
  @IsString()
  external_reference?: string;

  @ApiPropertyOptional({
    description: 'Tipo de pago utilizado',
    example: 'credit_card',
  })
  @IsOptional()
  @IsString()
  payment_type?: string;

  @ApiPropertyOptional({
    description: 'ID de la orden del comerciante',
    example: '34712773553',
  })
  @IsOptional()
  @IsString()
  merchant_order_id?: string;

  @ApiPropertyOptional({
    description: 'ID de la preferencia de pago',
    example: '2642663435-78e7c1b1-32de-4dc2-984f-3218eb8199a8',
  })
  @IsOptional()
  @IsString()
  preference_id?: string;

  @ApiPropertyOptional({
    description: 'ID del sitio de MercadoPago (ej: MLA para Argentina)',
    example: 'MLA',
  })
  @IsOptional()
  @IsString()
  site_id?: string;

  @ApiPropertyOptional({
    description: 'Modo de procesamiento',
    example: 'aggregator',
  })
  @IsOptional()
  @IsString()
  processing_mode?: string;

  @ApiPropertyOptional({
    description: 'ID de la cuenta del comerciante',
    example: null,
  })
  @IsOptional()
  @IsString()
  merchant_account_id?: string;
}
