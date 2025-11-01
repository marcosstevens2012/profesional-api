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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EmailVerifiedGuard, Public, Role, Roles } from '../common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AnalyticsQueryDto } from './dto/analytics.dto';
import {
  AvailabilityQueryDto,
  CreateAvailabilitySlotDto,
  UpdateAvailabilitySlotDto,
} from './dto/availability.dto';
import { ConfigureMercadoPagoDto } from './dto/configure-mercadopago.dto';
import { ReviewQueryDto, ReviewResponseDto } from './dto/reviews.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfilesService } from './profiles.service';

@ApiTags('Profiles')
@ApiBearerAuth()
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly _profilesService: ProfilesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Create professional profile' })
  create(@Body() createProfileDto: any) {
    return this._profilesService.create(createProfileDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  getMyProfile(@Req() req: any) {
    return this._profilesService.getMyProfile(req.user.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update current user profile' })
  updateMyProfile(@Req() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    return this._profilesService.updateMyProfile(req.user.userId, updateProfileDto);
  }

  @Post('me/upload-document')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.PROFESSIONAL)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload professional title document' })
  async uploadDocument(@Req() req: any, @UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) {
      throw new Error('No file provided');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG, WEBP, and PDF are allowed');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10MB limit');
    }

    return this._profilesService.uploadProfessionalDocument(
      req.user.userId,
      file.buffer,
      file.originalname,
      file.mimetype,
    );
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all profiles' })
  findAll(@Query() query: any) {
    return this._profilesService.findAll(query);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Get profile by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this._profilesService.findBySlug(slug);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get profile by ID' })
  findOne(@Param('id') id: string) {
    return this._profilesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Update profile' })
  update(@Param('id') id: string, @Body() updateProfileDto: any) {
    return this._profilesService.update(id, updateProfileDto);
  }

  @Delete(':id')
  @Roles(Role.PROFESSIONAL, Role.ADMIN)
  @ApiOperation({ summary: 'Delete profile' })
  remove(@Param('id') id: string) {
    return this._profilesService.remove(id);
  }

  @Patch('me/toggle-active')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Toggle professional active status' })
  toggleActiveStatus(@Req() req: any) {
    return this._profilesService.toggleProfessionalActiveStatus(req.user.userId);
  }

  @Get('me/active-status')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Get professional active status' })
  getActiveStatus(@Req() req: any) {
    return this._profilesService.getProfessionalActiveStatus(req.user.userId);
  }

  @Put('me/mercadopago')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Configure MercadoPago credentials' })
  configureMercadoPago(@Req() req: any, @Body() dto: ConfigureMercadoPagoDto) {
    return this._profilesService.configureMercadoPago(req.user.userId, dto);
  }

  @Get('me/mercadopago')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Get MercadoPago configuration status' })
  getMercadoPagoConfig(@Req() req: any) {
    return this._profilesService.getMercadoPagoConfig(req.user.userId);
  }

  // ========== AVAILABILITY ENDPOINTS ==========

  @Post('me/availability')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Create availability slot' })
  createAvailabilitySlot(@Req() req: any, @Body() createSlotDto: CreateAvailabilitySlotDto) {
    return this._profilesService.createAvailabilitySlot(req.user.userId, createSlotDto);
  }

  @Get('me/availability')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Get my availability slots' })
  getMyAvailability(@Req() req: any, @Query() query: AvailabilityQueryDto) {
    return this._profilesService.getMyAvailability(req.user.userId, query);
  }

  @Get(':professionalId/availability')
  @Public()
  @ApiOperation({ summary: 'Get professional availability slots' })
  getProfessionalAvailability(
    @Param('professionalId') professionalId: string,
    @Query() query: AvailabilityQueryDto,
  ) {
    return this._profilesService.getProfessionalAvailability(professionalId, query);
  }

  @Patch('me/availability/:slotId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Update availability slot' })
  updateAvailabilitySlot(
    @Req() req: any,
    @Param('slotId') slotId: string,
    @Body() updateSlotDto: UpdateAvailabilitySlotDto,
  ) {
    return this._profilesService.updateAvailabilitySlot(req.user.userId, slotId, updateSlotDto);
  }

  @Delete('me/availability/:slotId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Delete availability slot' })
  deleteAvailabilitySlot(@Req() req: any, @Param('slotId') slotId: string) {
    return this._profilesService.deleteAvailabilitySlot(req.user.userId, slotId);
  }

  // ========== REVIEWS ENDPOINTS ==========

  @Get('me/reviews')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Get my reviews' })
  getMyReviews(@Req() req: any, @Query() query: ReviewQueryDto) {
    return this._profilesService.getMyReviews(req.user.userId, query);
  }

  @Get('me/reviews/stats')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Get my reviews statistics' })
  getMyReviewStats(@Req() req: any) {
    return this._profilesService.getMyReviewStats(req.user.userId);
  }

  @Post('me/reviews/:reviewId/respond')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Respond to a review' })
  respondToReview(
    @Req() req: any,
    @Param('reviewId') reviewId: string,
    @Body() responseDto: ReviewResponseDto,
  ) {
    return this._profilesService.respondToReview(req.user.userId, reviewId, responseDto);
  }

  @Get(':professionalId/reviews')
  @Public()
  @ApiOperation({ summary: 'Get professional reviews (public)' })
  getProfessionalReviews(
    @Param('professionalId') professionalId: string,
    @Query() query: ReviewQueryDto,
  ) {
    return this._profilesService.getProfessionalReviews(professionalId, query);
  }

  // ========== ANALYTICS ENDPOINTS ==========

  @Get('me/analytics')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Get comprehensive analytics' })
  getMyAnalytics(@Req() req: any, @Query() query: AnalyticsQueryDto) {
    return this._profilesService.getMyAnalytics(req.user.userId, query);
  }

  @Get('me/analytics/bookings')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Get booking statistics' })
  getBookingStats(@Req() req: any, @Query() query: AnalyticsQueryDto) {
    return this._profilesService.getBookingStats(req.user.userId, query);
  }

  @Get('me/analytics/revenue')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Get revenue statistics' })
  getRevenueStats(@Req() req: any, @Query() query: AnalyticsQueryDto) {
    return this._profilesService.getRevenueStats(req.user.userId, query);
  }

  @Get('me/analytics/profile')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Get profile statistics' })
  getProfileStats(@Req() req: any, @Query() query: AnalyticsQueryDto) {
    return this._profilesService.getProfileStats(req.user.userId, query);
  }

  @Get('me/analytics/popular-times')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Get popular booking times' })
  getPopularTimes(@Req() req: any, @Query() query: AnalyticsQueryDto) {
    return this._profilesService.getPopularTimes(req.user.userId, query);
  }
}
