import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { Public, Role, Roles } from "../common";
import { ServicesService } from "./services.service";

@ApiTags("Services")
@Controller("services")
export class ServicesController {
  constructor(private readonly _servicesService: ServicesService) {}

  @Get("categories")
  @Public()
  @ApiOperation({ summary: "Get all service categories" })
  getCategories() {
    return this._servicesService.getCategories();
  }

  @Post()
  @ApiBearerAuth()
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: "Create service offering" })
  create(@Body() createServiceDto: any) {
    return this._servicesService.create(createServiceDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: "Search services" })
  @ApiQuery({ name: "category", required: false })
  @ApiQuery({ name: "location", required: false })
  @ApiQuery({ name: "q", required: false, description: "Search query" })
  findAll(
    @Query("category") category?: string,
    @Query("location") location?: string,
    @Query("q") query?: string
  ) {
    return this._servicesService.findAll({ category, location, query });
  }

  @Get(":id")
  @Public()
  @ApiOperation({ summary: "Get service by ID" })
  findOne(@Param("id") id: string) {
    return this._servicesService.findOne(id);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: "Update service" })
  update(@Param("id") id: string, @Body() updateServiceDto: any) {
    return this._servicesService.update(id, updateServiceDto);
  }

  @Delete(":id")
  @ApiBearerAuth()
  @Roles(Role.PROFESSIONAL, Role.ADMIN)
  @ApiOperation({ summary: "Delete service" })
  remove(@Param("id") id: string) {
    return this._servicesService.remove(id);
  }
}
