import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { TestingController } from './testing.controller';

@Module({
  imports: [NotificationsModule, WebsocketModule, AuthModule],
  controllers: [TestingController],
})
export class TestingModule {}
