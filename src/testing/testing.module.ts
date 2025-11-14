import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { TestingController } from './testing.controller';

@Module({
  imports: [NotificationsModule, WebsocketModule],
  controllers: [TestingController],
})
export class TestingModule {}
