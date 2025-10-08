import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";
import { Public } from "./common";

@ApiTags("app")
@Controller()
export class AppController {
  constructor(private readonly _appService: AppService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: "API welcome message" })
  @ApiResponse({ status: 200, description: "API is working correctly" })
  getHello(): string {
    return this._appService.getHello();
  }
}
