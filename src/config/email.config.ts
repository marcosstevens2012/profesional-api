import { registerAs } from "@nestjs/config";

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
  baseUrl: string;
}

export default registerAs(
  "email",
  (): EmailConfig => ({
    host: process.env.EMAIL_HOST || "localhost",
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    secure: process.env.EMAIL_SECURE === "true",
    user: process.env.EMAIL_USER || "",
    password: process.env.EMAIL_PASSWORD || "",
    from: process.env.EMAIL_FROM || "noreply@profesional.app",
    baseUrl: process.env.BASE_URL || "http://localhost:3000",
  })
);
