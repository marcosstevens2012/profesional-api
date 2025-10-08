import { IsEmail, IsOptional, IsString } from "class-validator";

export class ConfigureMercadoPagoDto {
  @IsEmail()
  mercadoPagoEmail!: string;

  @IsString()
  @IsOptional()
  mercadoPagoUserId?: string;
}

export class MercadoPagoConfigResponse {
  success!: boolean;
  mercadoPagoEmail!: string;
  mercadoPagoUserId?: string;
  configuredAt!: Date;
  message!: string;
}
