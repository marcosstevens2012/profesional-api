import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { NotificationsService } from "./notifications.service";

@ApiTags("notifications")
@Controller("notifications")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "Get user notifications" })
  async getNotifications(@Req() req: any, @Query("limit") limit?: number) {
    return this.notificationsService.getUserNotifications(
      req.user.userId,
      limit ? parseInt(limit.toString()) : 50
    );
  }

  @Get("unread")
  @ApiOperation({ summary: "Get unread notifications" })
  async getUnreadNotifications(@Req() req: any) {
    return this.notificationsService.getUnreadNotifications(req.user.userId);
  }

  @Get("unread/count")
  @ApiOperation({ summary: "Get unread notifications count" })
  async getUnreadCount(@Req() req: any) {
    const count = await this.notificationsService.getUnreadCount(
      req.user.userId
    );
    return { count };
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark notification as read" })
  async markAsRead(@Param("id") id: string, @Req() req: any) {
    return this.notificationsService.markAsRead(id, req.user.userId);
  }

  @Patch("read-all")
  @ApiOperation({ summary: "Mark all notifications as read" })
  async markAllAsRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete notification" })
  async deleteNotification(@Param("id") id: string, @Req() req: any) {
    return this.notificationsService.delete(id, req.user.userId);
  }
}
