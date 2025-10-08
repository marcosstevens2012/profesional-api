import { Controller, Get, Param } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "./config.service";

@ApiTags("config")
@Controller("config")
export class ConfigController {
  constructor(private readonly _configService: ConfigService) {}

  @Get()
  @ApiOperation({ summary: "Get all global configurations" })
  @ApiResponse({
    status: 200,
    description: "Configurations retrieved successfully",
  })
  async getAllConfigs() {
    return this._configService.getAllConfigs();
  }

  @Get(":key")
  @ApiOperation({ summary: "Get specific configuration by key" })
  @ApiResponse({
    status: 200,
    description: "Configuration retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Configuration not found" })
  async getConfigByKey(@Param("key") key: string) {
    return this._configService.getConfigByKey(key);
  }
}
