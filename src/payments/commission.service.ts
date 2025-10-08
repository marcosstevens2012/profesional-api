import { Injectable, Logger } from "@nestjs/common";
import { Decimal } from "@prisma/client/runtime/library";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);

  constructor(private readonly _prisma: PrismaService) {}

  async calculateCommission(paymentId: string) {
    this.logger.debug(`Calculating commission for payment ${paymentId}`);

    const payment = await this._prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      this.logger.warn(`Payment ${paymentId} not found`);
      return;
    }

    // Get commission rules
    const rules = await this._prisma.commissionRule.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (rules.length === 0) {
      this.logger.warn("No commission rules found");
      return;
    }

    const rule = rules[0]; // Take the first active rule
    const commissionAmount = payment.amount.mul(rule.percentage).div(100);

    this.logger.log(
      `Commission calculated: ${commissionAmount} (${rule.percentage}%) for payment ${paymentId}`
    );

    // You could store this commission calculation in the payment metadata
    await this._prisma.payment.update({
      where: { id: paymentId },
      data: {
        fee: commissionAmount,
        netAmount: payment.amount.sub(commissionAmount),
        metadata: {
          ...(payment.metadata as any),
          commission: {
            amount: commissionAmount.toString(),
            percentage: rule.percentage,
            ruleId: rule.id,
          },
        },
      },
    });

    return {
      totalAmount: commissionAmount,
      percentage: rule.percentage,
      ruleId: rule.id,
    };
  }

  async calculatePlatformFee(amount: Decimal): Promise<Decimal> {
    this.logger.debug(`Calculating platform fee for amount ${amount}`);

    // Get commission rules
    const rules = await this._prisma.commissionRule.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (rules.length === 0) {
      this.logger.warn("No commission rules found, defaulting to 5%");
      return amount.mul(5).div(100); // Default 5%
    }

    const rule = rules[0]; // Take the first active rule
    const platformFee = amount.mul(rule.percentage).div(100);

    this.logger.debug(
      `Platform fee calculated: ${platformFee} (${rule.percentage}%)`
    );
    return platformFee;
  }

  async getTotalCommissions(startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const payments = await this._prisma.payment.findMany({
      where: {
        status: "APPROVED",
        ...where,
      },
      select: {
        fee: true,
      },
    });

    const totalAmount = payments.reduce(
      (sum, payment) => sum.add(payment.fee),
      new Decimal(0)
    );

    return {
      totalAmount,
      totalCount: payments.length,
    };
  }
}
