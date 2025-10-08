import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "@node-rs/bcrypt";
import {
  AuthResponse,
  AuthTokens,
  ForgotPasswordRequest,
  LoginRequest,
  MessageResponse,
  RefreshTokenRequest,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from "@profesional/contracts";
import * as crypto from "crypto";
import { JwtPayload } from "../common/guards/jwt-auth.guard";
import { EmailService } from "../common/services/email.service";
import { JwtConfig } from "../config/jwt.config";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class AuthService {
  private readonly jwtConfig: JwtConfig;

  constructor(
    private readonly _jwtService: JwtService,
    private readonly _prisma: PrismaService,
    private readonly _emailService: EmailService,
    _configService: ConfigService
  ) {
    this.jwtConfig = _configService.get<JwtConfig>("jwt")!;
  }

  /**
   * Register a new user
   */
  async register(dto: RegisterRequest): Promise<AuthResponse> {
    const { email, password, name, role } = dto;

    // Check if user exists
    const existingUser = await this._prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException("El email ya está registrado");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and profile in transaction
    const user = await this._prisma.$transaction(async tx => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: role.toUpperCase() as any,
          status: "PENDING_VERIFICATION",
          profile: {
            create: {
              firstName: name.split(" ")[0] || name,
              lastName: name.split(" ").slice(1).join(" ") || "",
            },
          },
        },
        include: {
          profile: true,
        },
      });

      // Create email verification token
      const verificationToken = crypto.randomUUID();
      await tx.verificationToken.create({
        data: {
          userId: newUser.id,
          token: verificationToken,
          type: "EMAIL_VERIFICATION",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      // Send verification email
      await this._emailService.sendEmailVerification(email, verificationToken);

      return newUser;
    });

    // Generate tokens
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role.toLowerCase(),
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: `${user.profile?.firstName} ${user.profile?.lastName}`.trim(),
        avatar: user.profile?.avatar || undefined,
        isActive: user.status === "ACTIVE",
        role: user.role.toLowerCase() as any,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        status: user.status,
      },
      tokens,
    };
  }

  /**
   * Login user
   */
  async login(dto: LoginRequest): Promise<AuthResponse> {
    const { email, password } = dto;

    // Find user with profile
    const user = await this._prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException("Credenciales inválidas");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Credenciales inválidas");
    }

    // Check if user is suspended
    if (user.status === "SUSPENDED") {
      throw new UnauthorizedException("Cuenta suspendida");
    }

    // Generate tokens
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role.toLowerCase(),
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: `${user.profile?.firstName} ${user.profile?.lastName}`.trim(),
        avatar: user.profile?.avatar || undefined,
        isActive: user.status === "ACTIVE",
        role: user.role.toLowerCase() as any,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        status: user.status,
      },
      tokens,
    };
  }

  /**
   * Refresh tokens
   */
  async refreshToken(dto: RefreshTokenRequest): Promise<AuthTokens> {
    const { refreshToken } = dto;

    try {
      // Verify refresh token
      await this._jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.jwtConfig.refreshSecret,
      });

      // Check if refresh token exists in database
      const storedToken = await this._prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (
        !storedToken ||
        storedToken.revokedAt ||
        storedToken.expiresAt < new Date()
      ) {
        throw new UnauthorizedException("Token de actualización inválido");
      }

      // Revoke old refresh token
      await this._prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });

      // Generate new tokens
      const tokens = await this.generateTokens({
        sub: storedToken.user.id,
        email: storedToken.user.email,
        role: storedToken.user.role.toLowerCase(),
      });

      return tokens;
    } catch (error) {
      throw new UnauthorizedException("Token de actualización inválido");
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(dto: VerifyEmailRequest): Promise<MessageResponse> {
    const { token } = dto;

    const verificationToken = await this._prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (
      !verificationToken ||
      verificationToken.type !== "EMAIL_VERIFICATION" ||
      verificationToken.usedAt ||
      verificationToken.expiresAt < new Date()
    ) {
      throw new BadRequestException(
        "Token de verificación inválido o expirado"
      );
    }

    // Update user status and mark token as used
    await this._prisma.$transaction(async tx => {
      await tx.user.update({
        where: { id: verificationToken.userId! },
        data: { status: "ACTIVE" },
      });

      await tx.verificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      });
    });

    return { message: "Email verificado exitosamente" };
  }

  /**
   * Forgot password
   */
  async forgotPassword(dto: ForgotPasswordRequest): Promise<MessageResponse> {
    const { email } = dto;

    const user = await this._prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.deletedAt) {
      // Don't reveal if email exists for security
      return {
        message:
          "Si el email existe, recibirás instrucciones para restablecer tu contraseña",
      };
    }

    // Generate reset token
    const resetToken = crypto.randomUUID();

    await this._prisma.verificationToken.create({
      data: {
        userId: user.id,
        email: user.email,
        token: resetToken,
        type: "PASSWORD_RESET",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Send reset email
    await this._emailService.sendPasswordReset(email, resetToken);

    return {
      message:
        "Si el email existe, recibirás instrucciones para restablecer tu contraseña",
    };
  }

  /**
   * Reset password
   */
  async resetPassword(dto: ResetPasswordRequest): Promise<MessageResponse> {
    const { token, password } = dto;

    const verificationToken = await this._prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (
      !verificationToken ||
      verificationToken.type !== "PASSWORD_RESET" ||
      verificationToken.usedAt ||
      verificationToken.expiresAt < new Date()
    ) {
      throw new BadRequestException(
        "Token de restablecimiento inválido o expirado"
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password and mark token as used
    await this._prisma.$transaction(async tx => {
      await tx.user.update({
        where: { id: verificationToken.userId! },
        data: { password: hashedPassword },
      });

      await tx.verificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      });

      // Revoke all refresh tokens for this user
      await tx.refreshToken.updateMany({
        where: { userId: verificationToken.userId! },
        data: { revokedAt: new Date() },
      });
    });

    return { message: "Contraseña restablecida exitosamente" };
  }

  /**
   * Logout user (revoke refresh tokens)
   */
  async logout(userId: string): Promise<MessageResponse> {
    await this._prisma.refreshToken.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });

    return { message: "Sesión cerrada exitosamente" };
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(
    payload: Omit<JwtPayload, "iat" | "exp">
  ): Promise<AuthTokens> {
    // Generate access token
    const accessToken = await this._jwtService.signAsync(payload, {
      secret: this.jwtConfig.secret,
      expiresIn: this.jwtConfig.accessTokenExpiresIn,
    });

    // Generate refresh token
    const refreshToken = await this._jwtService.signAsync(payload, {
      secret: this.jwtConfig.refreshSecret,
      expiresIn: this.jwtConfig.refreshTokenExpiresIn,
    });

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this._prisma.refreshToken.create({
      data: {
        userId: payload.sub,
        token: refreshToken,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }
}
