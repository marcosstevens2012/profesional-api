import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { HttpExceptionFilter, JwtAuthGuard, RolesGuard } from "./common";
import { validateEnv } from "./config";
import emailConfig from "./config/email.config";
import jwtConfig from "./config/jwt.config";

// Feature modules
import { AdminModule } from "./admin/admin.module";
import { AuthModule } from "./auth/auth.module";
import { BookingsModule } from "./bookings/bookings.module";
import { ConfigModule as GlobalConfigModule } from "./config/config.module";
import { DatabaseModule } from "./database/database.module";
import { ExamplesModule } from "./examples/examples.module";
import { HealthModule } from "./health/health.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PaymentsModule } from "./payments/payments.module";
import { ProfilesModule } from "./profiles/profiles.module";
import { SearchModule } from "./search/search.module";
import { ServicesModule } from "./services/services.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: [".env.local", ".env"],
      load: [jwtConfig, emailConfig],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get("RATE_LIMIT_TTL", 60) * 1000,
          limit: config.get("RATE_LIMIT_MAX", 100),
        },
      ],
    }),

    // Logging
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get("NODE_ENV") === "development" ? "debug" : "info",
          transport:
            config.get("NODE_ENV") === "development"
              ? { target: "pino-pretty", options: { singleLine: true } }
              : undefined,
          redact: ["req.headers.authorization"],
          serializers: {
            req: (req: any) => ({
              method: req.method,
              url: req.url,
              userAgent: req.headers["user-agent"],
              requestId: req.requestId,
            }),
          },
        },
      }),
    }),

    // Feature modules
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    ServicesModule,
    SearchModule,
    PaymentsModule,
    BookingsModule,
    NotificationsModule,
    ExamplesModule,
    AdminModule,
    GlobalConfigModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global guards
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
