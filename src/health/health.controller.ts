import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { HealthCheck, HealthCheckService } from "@nestjs/terminus";
import { Public } from "../common";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly _health: HealthCheckService) {}

  @Get()
  @Public()
  @HealthCheck()
  @ApiOperation({ summary: "Health check endpoint" })
  check() {
    return this._health.check([
      // Add more health checks as needed (database, redis, etc.)
    ]);
  }

  @Get("ready")
  @Public()
  @ApiOperation({ summary: "Readiness check" })
  ready() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
