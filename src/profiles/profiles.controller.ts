import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public, Role, Roles } from "../common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { ConfigureMercadoPagoDto } from "./dto/configure-mercadopago.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ProfilesService } from "./profiles.service";

@ApiTags("Profiles")
@ApiBearerAuth()
@Controller("profiles")
export class ProfilesController {
  constructor(private readonly _profilesService: ProfilesService) {}

  @Post()
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: "Create professional profile" })
  create(@Body() createProfileDto: any) {
    return this._profilesService.create(createProfileDto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get current user profile" })
  getMyProfile(@Req() req: any) {
    return this._profilesService.getMyProfile(req.user.userId);
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Update current user profile" })
  updateMyProfile(@Req() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    return this._profilesService.updateMyProfile(
      req.user.userId,
      updateProfileDto
    );
  }

  @Get()
  @Public()
  @ApiOperation({ summary: "Get all profiles" })
  findAll(@Query() query: any) {
    return this._profilesService.findAll(query);
  }

  @Get("slug/:slug")
  @Public()
  @ApiOperation({ summary: "Get profile by slug" })
  findBySlug(@Param("slug") slug: string) {
    return this._profilesService.findBySlug(slug);
  }

  @Get(":id")
  @Public()
  @ApiOperation({ summary: "Get profile by ID" })
  findOne(@Param("id") id: string) {
    return this._profilesService.findOne(id);
  }

  @Patch(":id")
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: "Update profile" })
  update(@Param("id") id: string, @Body() updateProfileDto: any) {
    return this._profilesService.update(id, updateProfileDto);
  }

  @Delete(":id")
  @Roles(Role.PROFESSIONAL, Role.ADMIN)
  @ApiOperation({ summary: "Delete profile" })
  remove(@Param("id") id: string) {
    return this._profilesService.remove(id);
  }

  @Patch("me/toggle-active")
  @UseGuards(JwtAuthGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: "Toggle professional active status" })
  toggleActiveStatus(@Req() req: any) {
    return this._profilesService.toggleProfessionalActiveStatus(
      req.user.userId
    );
  }

  @Get("me/active-status")
  @UseGuards(JwtAuthGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: "Get professional active status" })
  getActiveStatus(@Req() req: any) {
    return this._profilesService.getProfessionalActiveStatus(req.user.userId);
  }

  @Put("me/mercadopago")
  @UseGuards(JwtAuthGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: "Configure MercadoPago credentials" })
  configureMercadoPago(@Req() req: any, @Body() dto: ConfigureMercadoPagoDto) {
    return this._profilesService.configureMercadoPago(req.user.userId, dto);
  }

  @Get("me/mercadopago")
  @UseGuards(JwtAuthGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: "Get MercadoPago configuration status" })
  getMercadoPagoConfig(@Req() req: any) {
    return this._profilesService.getMercadoPagoConfig(req.user.userId);
  }
}
