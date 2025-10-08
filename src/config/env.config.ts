import { z } from "zod";

export const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3002),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // CORS
  CORS_ORIGINS: z.string().transform(str => str.split(",")),

  // Rate Limiting
  RATE_LIMIT_TTL: z.coerce.number().default(60),
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  // Swagger
  ENABLE_SWAGGER: z.coerce.boolean().default(false),

  // Sentry
  SENTRY_DSN: z.string().optional(),

  // Request ID
  REQUEST_ID_HEADER: z.string().default("x-request-id"),

  // Database
  DATABASE_URL: z.string().url(),

  // Email
  EMAIL_FROM: z.string().email().default("noreply@profesional.com"),

  // Supabase Storage
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_SIGNED_URL_TTL: z.coerce.number().default(900), // 15 minutes

  // Mercado Pago
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1),
  MERCADOPAGO_PUBLIC_KEY: z.string().min(1),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().min(1),
  MERCADOPAGO_BASE_URL: z.string().url().default("https://api.mercadopago.com"),
  MERCADOPAGO_SANDBOX: z.coerce.boolean().default(true),

  // Frontend
  FRONTEND_BASE_URL: z.string().url().default("http://localhost:3000"),
});

export type Env = z.infer<typeof EnvSchema>;

export const validateEnv = (config: Record<string, unknown>): Env => {
  const result = EnvSchema.safeParse(config);

  if (!result.success) {
    throw new Error(
      `Invalid environment configuration: ${result.error.message}`
    );
  }

  return result.data;
};
