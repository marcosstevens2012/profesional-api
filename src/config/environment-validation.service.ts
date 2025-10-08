import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface EnvironmentConfig {
  // Common
  nodeEnv: string;
  logLevel: string;
  sentryDsn?: string;
  posthogKey?: string;

  // Database
  databaseUrl: string;

  // Authentication
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpiresIn: string;
  jwtRefreshExpiresIn: string;

  // MercadoPago
  mpAccessToken: string;
  mpWebhookSecret: string;
  mpEnvironment: string;

  // Storage
  storageEndpoint: string;
  storageBucket: string;
  storageAccessKey: string;
  storageSecretKey: string;
  storageRegion: string;

  // Security
  allowedOrigins: string[];

  // Email (Optional)
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;

  // Server
  port: number;
}

@Injectable()
export class EnvironmentValidationService {
  private readonly logger = new Logger(EnvironmentValidationService.name);

  constructor(private configService: ConfigService) {
    this.validateEnvironment();
  }

  private validateEnvironment(): void {
    const errors: string[] = [];

    // Required variables
    const requiredVars = [
      "NODE_ENV",
      "DATABASE_URL",
      "JWT_SECRET",
      "JWT_REFRESH_SECRET",
      "MP_ACCESS_TOKEN",
      "MP_WEBHOOK_SECRET",
      "STORAGE_ENDPOINT",
      "STORAGE_BUCKET",
      "STORAGE_ACCESS_KEY",
      "STORAGE_SECRET_KEY",
      "ALLOWED_ORIGINS",
    ];

    for (const varName of requiredVars) {
      const value = this.configService.get<string>(varName);
      if (!value) {
        errors.push(`Missing required environment variable: ${varName}`);
      }
    }

    // Validate NODE_ENV
    const nodeEnv = this.configService.get<string>("NODE_ENV");
    if (nodeEnv && !["development", "production", "test"].includes(nodeEnv)) {
      errors.push("NODE_ENV must be one of: development, production, test");
    }

    // Validate LOG_LEVEL
    const logLevel = this.configService.get<string>("LOG_LEVEL");
    if (logLevel && !["debug", "info", "warn", "error"].includes(logLevel)) {
      errors.push("LOG_LEVEL must be one of: debug, info, warn, error");
    }

    // Validate JWT secrets length
    const jwtSecret = this.configService.get<string>("JWT_SECRET");
    if (jwtSecret && jwtSecret.length < 32) {
      errors.push("JWT_SECRET must be at least 32 characters long");
    }

    const jwtRefreshSecret =
      this.configService.get<string>("JWT_REFRESH_SECRET");
    if (jwtRefreshSecret && jwtRefreshSecret.length < 32) {
      errors.push("JWT_REFRESH_SECRET must be at least 32 characters long");
    }

    // Validate MP environment
    const mpEnvironment = this.configService.get<string>("MP_ENVIRONMENT");
    if (mpEnvironment && !["sandbox", "production"].includes(mpEnvironment)) {
      errors.push("MP_ENVIRONMENT must be either sandbox or production");
    }

    // Validate URLs
    const databaseUrl = this.configService.get<string>("DATABASE_URL");
    if (databaseUrl && !databaseUrl.startsWith("postgresql://")) {
      errors.push("DATABASE_URL must be a valid PostgreSQL connection string");
    }

    // Production-specific validations
    if (nodeEnv === "production") {
      this.validateProductionEnvironment(errors);
    }

    if (errors.length > 0) {
      this.logger.error("Environment validation failed:");
      errors.forEach(error => this.logger.error(`  - ${error}`));
      throw new Error(`Environment validation failed: ${errors.join(", ")}`);
    }

    this.logger.log("Environment validation passed");
  }

  private validateProductionEnvironment(errors: string[]): void {
    // Production-specific checks
    const jwtSecret = this.configService.get<string>("JWT_SECRET");
    if (
      jwtSecret &&
      (jwtSecret.includes("development") || jwtSecret.includes("test"))
    ) {
      errors.push(
        "JWT_SECRET should not contain development/test keywords in production"
      );
    }

    const mpAccessToken = this.configService.get<string>("MP_ACCESS_TOKEN");
    if (mpAccessToken && mpAccessToken.startsWith("TEST-")) {
      errors.push("MP_ACCESS_TOKEN should not be a test token in production");
    }

    // Recommend optional but important variables for production
    const sentryDsn = this.configService.get<string>("SENTRY_DSN");
    if (!sentryDsn) {
      this.logger.warn("SENTRY_DSN not set - error tracking disabled");
    }

    const posthogKey = this.configService.get<string>("POSTHOG_KEY");
    if (!posthogKey) {
      this.logger.warn("POSTHOG_KEY not set - analytics disabled");
    }
  }

  getConfig(): EnvironmentConfig {
    return {
      // Common
      nodeEnv: this.configService.get<string>("NODE_ENV", "development"),
      logLevel: this.configService.get<string>("LOG_LEVEL", "info"),
      sentryDsn: this.configService.get<string>("SENTRY_DSN"),
      posthogKey: this.configService.get<string>("POSTHOG_KEY"),

      // Database
      databaseUrl: this.configService.get<string>("DATABASE_URL") || "",

      // Authentication
      jwtSecret: this.configService.get<string>("JWT_SECRET") || "",
      jwtRefreshSecret:
        this.configService.get<string>("JWT_REFRESH_SECRET") || "",
      jwtExpiresIn: this.configService.get<string>("JWT_EXPIRES_IN", "15m"),
      jwtRefreshExpiresIn: this.configService.get<string>(
        "JWT_REFRESH_EXPIRES_IN",
        "7d"
      ),

      // MercadoPago
      mpAccessToken: this.configService.get<string>("MP_ACCESS_TOKEN") || "",
      mpWebhookSecret:
        this.configService.get<string>("MP_WEBHOOK_SECRET") || "",
      mpEnvironment: this.configService.get<string>(
        "MP_ENVIRONMENT",
        "sandbox"
      ),

      // Storage
      storageEndpoint: this.configService.get<string>("STORAGE_ENDPOINT") || "",
      storageBucket: this.configService.get<string>("STORAGE_BUCKET") || "",
      storageAccessKey:
        this.configService.get<string>("STORAGE_ACCESS_KEY") || "",
      storageSecretKey:
        this.configService.get<string>("STORAGE_SECRET_KEY") || "",
      storageRegion: this.configService.get<string>(
        "STORAGE_REGION",
        "us-east-1"
      ),

      // Security
      allowedOrigins: this.configService
        .get<string>("ALLOWED_ORIGINS", "http://localhost:3000")
        .split(","),

      // Email (Optional)
      smtpHost: this.configService.get<string>("SMTP_HOST"),
      smtpPort: this.configService.get<number>("SMTP_PORT"),
      smtpUser: this.configService.get<string>("SMTP_USER"),
      smtpPass: this.configService.get<string>("SMTP_PASS"),

      // Server
      port: this.configService.get<number>("PORT", 3001),
    };
  }

  validateRuntimeConfig(): void {
    const config = this.getConfig();

    // Runtime validations that might fail during startup
    this.logger.log(`Starting in ${config.nodeEnv} mode`);
    this.logger.log(`Log level: ${config.logLevel}`);
    this.logger.log(`Port: ${config.port}`);
    this.logger.log(`Allowed origins: ${config.allowedOrigins.join(", ")}`);

    if (config.sentryDsn) {
      this.logger.log("Sentry error tracking enabled");
    }

    if (config.posthogKey) {
      this.logger.log("PostHog analytics enabled");
    }
  }
}
