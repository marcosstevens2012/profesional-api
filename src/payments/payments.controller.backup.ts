import { Controller, Post, Body, Get, Param, Logger } from "@nestjs/common";

@Controller("payments")
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor() {}

  @Post("webhook")
  async handleWebhook(@Body() _data: any) {
    this.logger.log("Webhook received");
    return { status: "ok" };
  }

  @Get(":id")
  async getPayment(@Param("id") id: string) {
    return { id, status: "PENDING" };
  }
}
