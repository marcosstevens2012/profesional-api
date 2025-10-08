import { registerAs } from "@nestjs/config";

export interface JwtConfig {
  secret: string;
  refreshSecret: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

export default registerAs(
  "jwt",
  (): JwtConfig => ({
    secret:
      process.env.JWT_SECRET ||
      "your-super-secret-jwt-key-change-in-production",
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      "your-super-secret-refresh-key-change-in-production",
    accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  })
);
