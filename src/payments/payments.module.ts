import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { CommissionService } from "./commission.service";
import { MercadoPagoService } from "./mercadopago.service";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";

@Module({
  imports: [
    DatabaseModule,
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, MercadoPagoService, CommissionService],
  exports: [PaymentsService, MercadoPagoService, CommissionService],
})
export class PaymentsModule {}
