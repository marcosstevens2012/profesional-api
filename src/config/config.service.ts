import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class ConfigService {
  constructor(private readonly _prisma: PrismaService) {}

  async getAllConfigs() {
    return this._prisma.globalConfig.findMany({
      select: {
        key: true,
        value: true,
        description: true,
      },
    });
  }

  async getConfigByKey(key: string) {
    const config = await this._prisma.globalConfig.findUnique({
      where: { key },
      select: {
        key: true,
        value: true,
        description: true,
      },
    });

    if (!config) {
      throw new NotFoundException(`Configuration with key "${key}" not found`);
    }

    return config;
  }

  async getConsultationPrice() {
    const config = await this.getConfigByKey("consultation_price");
    return config.value;
  }
}
