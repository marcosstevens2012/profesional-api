import { z } from "zod";

// Environment validation schema
export const environmentSchema = z.object({
  // Common
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  PORT: z.string().transform(Number).default("3001"),

  // Optional observability
  SENTRY_DSN: z.string().url().optional(),
  POSTHOG_KEY: z.string().min(1).optional(),

  // Database
  DATABASE_URL: z
    .string()
    .url()
    .refine(url => url.startsWith("postgresql://"), {
      message: "DATABASE_URL must be a valid PostgreSQL connection string",
    }),

  // Authentication
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // MercadoPago
  MP_ACCESS_TOKEN: z.string().min(1),
  MP_WEBHOOK_SECRET: z.string().min(1),
  MP_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),

  // Storage
  STORAGE_ENDPOINT: z.string().url(),
  STORAGE_BUCKET: z.string().min(1),
  STORAGE_ACCESS_KEY: z.string().min(1),
  STORAGE_SECRET_KEY: z.string().min(1),
  STORAGE_REGION: z.string().default("us-east-1"),

  // Security
  ALLOWED_ORIGINS: z
    .string()
    .transform(origins => origins.split(",").map(origin => origin.trim())),

  // Email (Optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

export type EnvironmentVariables = z.infer<typeof environmentSchema>;

export function validateEnvironment(): EnvironmentVariables {
  try {
    const validated = environmentSchema.parse(process.env);

    // Additional production validations
    if (validated.NODE_ENV === "production") {
      if (
        validated.JWT_SECRET.includes("development") ||
        validated.JWT_SECRET.includes("test")
      ) {
        throw new Error(
          "JWT_SECRET should not contain development/test keywords in production"
        );
      }

      if (validated.MP_ACCESS_TOKEN.startsWith("TEST-")) {
        throw new Error(
          "MP_ACCESS_TOKEN should not be a test token in production"
        );
      }
    }

    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(
        err => `${err.path.join(".")}: ${err.message}`
      );
      throw new Error(
        `Environment validation failed:\n${errorMessages.join("\n")}`
      );
    }
    throw error;
  }
}
