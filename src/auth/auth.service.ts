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
} from '@marcosstevens2012/contracts';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from '@node-rs/bcrypt';
import * as crypto from 'crypto';
import { JwtPayload } from '../common/guards/jwt-auth.guard';
import { EmailService } from '../common/services/email.service';
import { JwtConfig } from '../config/jwt.config';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuthService {
  private readonly jwtConfig: JwtConfig;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly _jwtService: JwtService,
    private readonly _prisma: PrismaService,
    private readonly _emailService: EmailService,
    _configService: ConfigService,
  ) {
    this.jwtConfig = _configService.get<JwtConfig>('jwt')!;
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
      throw new ConflictException('El email ya está registrado');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and profile in transaction
    const user = await this._prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: role.toUpperCase() as 'CLIENT' | 'PROFESSIONAL' | 'ADMIN',
          status: 'PENDING_VERIFICATION',
          profile: {
            create: {
              firstName: name.split(' ')[0] || name,
              lastName: name.split(' ').slice(1).join(' ') || '',
            },
          },
        },
        include: {
          profile: true,
        },
      });

      // Si el usuario es profesional, crear el ProfessionalProfile vacío
      if (role.toUpperCase() === 'PROFESSIONAL') {
        // Buscar una categoría por defecto (la primera disponible)
        const defaultCategory = await tx.serviceCategory.findFirst({
          orderBy: { order: 'asc' },
        });

        // Buscar una ubicación por defecto
        const defaultLocation = await tx.location.findFirst();

        if (!defaultCategory || !defaultLocation) {
          throw new InternalServerErrorException(
            'No se encontraron categorías o ubicaciones disponibles. Contacte al administrador.',
          );
        }

        await tx.professionalProfile.create({
          data: {
            userId: newUser.id,
            email: email,
            name: name,
            bio: null,
            description: null,
            pricePerSession: 25000.0, // Precio por defecto
            standardDuration: 60, // 60 minutos por defecto
            serviceCategoryId: defaultCategory.id,
            locationId: defaultLocation.id,
            isVerified: false, // Se verificará cuando el usuario complete su perfil
            isActive: false, // Inactivo hasta que complete el perfil
          },
        });
      }

      // Create email verification token
      const verificationToken = crypto.randomUUID();
      await tx.verificationToken.create({
        data: {
          userId: newUser.id,
          token: verificationToken,
          type: 'EMAIL_VERIFICATION',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      // Send verification email
      await this._emailService.sendEmailVerification(email, verificationToken, role);

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
        isActive: user.status === 'ACTIVE',
        role: user.role.toLowerCase() as 'client' | 'professional' | 'admin',
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
    try {
      const { email, password } = dto;

      this.logger.log(`Login attempt for email: ${email}`);

      // Find user with profile
      const user = await this._prisma.user.findUnique({
        where: { email },
        include: { profile: true },
      });

      if (!user || user.deletedAt) {
        this.logger.warn(`Login failed: User not found or deleted - ${email}`);
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Login failed: Invalid password - ${email}`);
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // Check if user is suspended
      if (user.status === 'SUSPENDED') {
        this.logger.warn(`Login failed: User suspended - ${email}`);
        throw new UnauthorizedException(
          'Tu cuenta ha sido suspendida. Contactá al soporte para más información.',
        );
      }

      // Check if email is verified
      if (user.status === 'PENDING_VERIFICATION') {
        this.logger.warn(`Login failed: Email not verified - ${email}`);
        throw new UnauthorizedException(
          'Necesitás verificar tu email antes de iniciar sesión. Revisá tu correo electrónico.',
        );
      }

      this.logger.log(`Generating tokens for user: ${user.id}`);

      // Generate tokens
      const tokens = await this.generateTokens({
        sub: user.id,
        email: user.email,
        role: user.role.toLowerCase(),
      });

      this.logger.log(`Login successful for user: ${user.id}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: `${user.profile?.firstName} ${user.profile?.lastName}`.trim(),
          avatar: user.profile?.avatar || undefined,
          isActive: user.status === 'ACTIVE',
          role: user.role.toLowerCase() as 'client' | 'professional' | 'admin',
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          status: user.status,
        },
        tokens,
      };
    } catch (error) {
      // Re-throw HttpExceptions (UnauthorizedException, etc.)
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Log and wrap any other errors
      this.logger.error('Unexpected error during login:', error);
      throw new InternalServerErrorException('Error al procesar el inicio de sesión');
    }
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

      if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Token de actualización inválido');
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
      throw new UnauthorizedException('Token de actualización inválido');
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

    if (!verificationToken) {
      throw new BadRequestException('Token de verificación inválido');
    }

    if (verificationToken.type !== 'EMAIL_VERIFICATION') {
      throw new BadRequestException('Token de verificación inválido');
    }

    if (verificationToken.usedAt) {
      throw new BadRequestException('Este token ya fue utilizado. Tu email ya está verificado.');
    }

    if (verificationToken.expiresAt < new Date()) {
      throw new BadRequestException(
        'El token de verificación ha expirado. Solicitá un nuevo email de verificación.',
      );
    }

    // Update user status and mark token as used
    await this._prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: verificationToken.userId! },
        data: { status: 'ACTIVE' },
      });

      await tx.verificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      });
    });

    return {
      message:
        '¡Email verificado exitosamente! Ya podés acceder a todas las funcionalidades de la plataforma.',
    };
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
        message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña',
      };
    }

    // Generate reset token
    const resetToken = crypto.randomUUID();

    await this._prisma.verificationToken.create({
      data: {
        userId: user.id,
        email: user.email,
        token: resetToken,
        type: 'PASSWORD_RESET',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Send reset email
    await this._emailService.sendPasswordReset(email, resetToken);

    return {
      message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña',
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
      verificationToken.type !== 'PASSWORD_RESET' ||
      verificationToken.usedAt ||
      verificationToken.expiresAt < new Date()
    ) {
      throw new BadRequestException('Token de restablecimiento inválido o expirado');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password and mark token as used
    await this._prisma.$transaction(async (tx) => {
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

    return { message: 'Contraseña restablecida exitosamente' };
  }

  /**
   * Resend email verification
   */
  async resendVerificationEmail(email: string): Promise<MessageResponse> {
    const user = await this._prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.deletedAt) {
      // Don't reveal if email exists for security
      return {
        message:
          'Si el email existe y no está verificado, recibirás un nuevo correo de verificación.',
      };
    }

    // Check if already verified
    if (user.status === 'ACTIVE') {
      throw new BadRequestException('Este email ya está verificado');
    }

    // Check if user is suspended
    if (user.status === 'SUSPENDED') {
      throw new BadRequestException(
        'No se puede enviar email de verificación a una cuenta suspendida',
      );
    }

    // Invalidate previous verification tokens
    await this._prisma.verificationToken.updateMany({
      where: {
        userId: user.id,
        type: 'EMAIL_VERIFICATION',
        usedAt: null,
      },
      data: {
        usedAt: new Date(), // Mark as used to invalidate
      },
    });

    // Generate new verification token
    const verificationToken = crypto.randomUUID();
    await this._prisma.verificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        type: 'EMAIL_VERIFICATION',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Send verification email
    await this._emailService.sendEmailVerification(user.email, verificationToken, user.role);

    return {
      message: 'Email de verificación enviado. Revisá tu correo electrónico (incluyendo spam).',
    };
  }

  /**
   * Logout user (revoke refresh tokens)
   */
  async logout(userId: string): Promise<MessageResponse> {
    await this._prisma.refreshToken.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });

    return { message: 'Sesión cerrada exitosamente' };
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<AuthTokens> {
    try {
      this.logger.log(`Generating tokens for user: ${payload.sub}`);

      // Validate JWT configuration
      if (!this.jwtConfig.secret || !this.jwtConfig.refreshSecret) {
        this.logger.error('JWT secrets are not configured properly');
        throw new InternalServerErrorException('Error de configuración del servidor');
      }

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

      this.logger.log(`Tokens generated successfully for user: ${payload.sub}`);

      return {
        accessToken,
        refreshToken,
        expiresIn: 15 * 60, // 15 minutes in seconds
      };
    } catch (error) {
      this.logger.error('Error generating tokens:', error);
      throw new InternalServerErrorException('Error al generar tokens de autenticación');
    }
  }
}
