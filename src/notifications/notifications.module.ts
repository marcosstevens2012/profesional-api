import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../database/database.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { EmailService } from './email.service';
import { NotificationAlertService } from './notification-alert.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushNotificationService } from './push-notification.service';
import { WhatsAppService } from './whatsapp.service';

@Module({
  imports: [DatabaseModule, JwtModule, WebsocketModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationAlertService,
    EmailService,
    WhatsAppService,
    PushNotificationService,
  ],
  exports: [
    NotificationsService,
    NotificationAlertService,
    EmailService,
    WhatsAppService,
    PushNotificationService,
  ],
})
export class NotificationsModule {}
