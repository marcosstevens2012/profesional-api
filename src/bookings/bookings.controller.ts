import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role, Roles } from "../common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { BookingsService } from "./bookings.service";

@ApiTags("Bookings")
@ApiBearerAuth()
@Controller("bookings")
export class BookingsController {
  constructor(private readonly _bookingsService: BookingsService) {}

  @Post()
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: "Create booking request" })
  create(@Body() createBookingDto: any) {
    return this._bookingsService.create(createBookingDto);
  }

  @Get()
  @ApiOperation({ summary: "Get user bookings" })
  findAll() {
    return this._bookingsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get booking by ID" })
  findOne(@Param("id") id: string) {
    return this._bookingsService.findOne(id);
  }

  @Patch(":id/status")
  @Roles(Role.PROFESSIONAL, Role.ADMIN)
  @ApiOperation({ summary: "Update booking status" })
  updateStatus(@Param("id") id: string, @Body() statusDto: any) {
    return this._bookingsService.updateStatus(id, statusDto);
  }

  // Nuevos endpoints para Jitsi Meeting
  @Get(":id/meeting-status")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get meeting status for booking" })
  getMeetingStatus(@Param("id") id: string) {
    return this._bookingsService.getMeetingStatus(id);
  }

  @Patch(":id/accept-meeting")
  @UseGuards(JwtAuthGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: "Professional accepts meeting" })
  acceptMeeting(@Param("id") id: string, @Req() req: any) {
    return this._bookingsService.acceptMeeting(id, req.user.userId);
  }

  @Get(":id/join-meeting")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Check if user can join meeting and get room info" })
  canJoinMeeting(@Param("id") id: string, @Req() req: any) {
    return this._bookingsService.canUserJoinMeeting(id, req.user.userId);
  }

  @Patch(":id/mark-waiting")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Mark booking as waiting for professional (after payment)",
  })
  markAsWaiting(@Param("id") id: string) {
    return this._bookingsService.markAsWaitingForProfessional(id);
  }

  @Get("professional/meetings")
  @UseGuards(JwtAuthGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: "Get professional's pending meetings" })
  getProfessionalMeetings(@Req() req: any) {
    return this._bookingsService.getProfessionalPendingMeetings(
      req.user.userId
    );
  }

  @Delete(":id")
  @ApiOperation({ summary: "Cancel booking" })
  remove(@Param("id") id: string) {
    return this._bookingsService.remove(id);
  }

  @Post(":id/payment")
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: "Create payment for booking" })
  createPayment(@Param("id") bookingId: string, @Req() req: any) {
    return this._bookingsService.createPaymentForBooking(
      bookingId,
      req.user.userId
    );
  }
}
