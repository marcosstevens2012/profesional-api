import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * Guard to ensure user has verified their email
 * Use this guard on endpoints that require email verification
 */
@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId || request.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { status: true, email: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (user.status === 'PENDING_VERIFICATION') {
      throw new UnauthorizedException(
        'Necesitás verificar tu email antes de acceder a esta funcionalidad. Revisá tu correo electrónico.',
      );
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Tu cuenta ha sido suspendida');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tu cuenta no está activa');
    }

    return true;
  }
}
