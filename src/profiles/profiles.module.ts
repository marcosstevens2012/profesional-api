import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StorageService } from '../common/services/storage.service';
import { DatabaseModule } from '../database/database.module';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ProfilesController],
  providers: [ProfilesService, StorageService],
})
export class ProfilesModule {}
