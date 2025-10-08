import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export enum CurrencyId {
  ARS = "ARS", // Argentina
}

export enum ServiceType {
  ONLINE_CONSULTATION = "online_consultation",
  IN_PERSON_CONSULTATION = "in_person_consultation",
  FOLLOW_UP = "follow_up",
  EMERGENCY = "emergency",
}

export class CreateImprovedPreferenceDto {
  // Datos del servicio
  @IsString()
  professionalSlug!: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsEnum(CurrencyId)
  @IsOptional()
  currencyId?: CurrencyId;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  pictureUrl?: string;

  // Datos del pagador (opcional pero recomendado)
  @IsEmail()
  @IsOptional()
  payerEmail?: string;

  @IsString()
  @IsOptional()
  payerName?: string;

  @IsString()
  @IsOptional()
  payerSurname?: string;

  @IsString()
  @IsOptional()
  payerPhone?: string;

  @IsString()
  @IsOptional()
  payerIdentificationType?: string; // 'DNI', 'CPF', 'CUIT', etc.

  @IsString()
  @IsOptional()
  payerIdentificationNumber?: string;

  // Metadata
  @IsString()
  @IsOptional()
  bookingId?: string;

  @IsString()
  @IsOptional()
  externalReference?: string;

  @IsEnum(ServiceType)
  @IsOptional()
  serviceType?: ServiceType;

  @IsString()
  @IsOptional()
  appointmentDate?: string;

  // Configuración
  @IsNumber()
  @IsOptional()
  maxInstallments?: number;

  @IsNumber()
  @IsOptional()
  defaultInstallments?: number;
}
