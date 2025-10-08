import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { Logger as PinoLogger } from "nestjs-pino";
import { AppModule } from "./app.module";
import { requestIdMiddleware } from "./common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = app.get(PinoLogger);
  app.useLogger(logger);

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allow Swagger UI if enabled
    })
  );

  // Request ID middleware
  app.use(
    requestIdMiddleware(configService.get("REQUEST_ID_HEADER", "x-request-id"))
  );

  // CORS configuration
  const corsOrigins = configService.get<string[]>("CORS_ORIGINS", [
    "http://localhost:3000",
  ]);
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      configService.get("REQUEST_ID_HEADER", "x-request-id"),
    ],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      disableErrorMessages: configService.get("NODE_ENV") === "production",
    })
  );

  // Swagger documentation (configurable)
  if (configService.get("ENABLE_SWAGGER", false)) {
    const config = new DocumentBuilder()
      .setTitle("Profesional API")
      .setDescription(
        "API modular escalable para la plataforma de profesionales"
      )
      .setVersion("1.0")
      .addBearerAuth()
      .addTag("Health", "Health check endpoints")
      .addTag("Auth", "Authentication endpoints")
      .addTag("Users", "User management")
      .addTag("Profiles", "Professional profiles")
      .addTag("Services", "Services and categories")
      .addTag("Search", "Search functionality")
      .addTag("Bookings", "Booking management")
      .addTag("Admin", "Admin endpoints")
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api-docs", app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log(`📚 Swagger documentation available at /api-docs`);
  }

  // Sentry integration (if configured)
  const sentryDsn = configService.get("SENTRY_DSN");
  if (sentryDsn) {
    const Sentry = await import("@sentry/node");
    Sentry.init({
      dsn: sentryDsn,
      environment: configService.get("NODE_ENV"),
      tracesSampleRate: 0.1,
    });
    logger.log("🔍 Sentry monitoring enabled");
  }

  // Start server
  const port = configService.get("PORT", 3002);
  await app.listen(port, "0.0.0.0");

  const nodeEnv = configService.get("NODE_ENV");
  logger.log(`🚀 API running in ${nodeEnv} mode on port ${port}`);
  logger.log(`🔒 CORS origins: ${corsOrigins.join(", ")}`);
  logger.log(
    `💨 Rate limiting: ${configService.get(
      "RATE_LIMIT_MAX"
    )} req/${configService.get("RATE_LIMIT_TTL")}s`
  );
}

bootstrap().catch(error => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});
