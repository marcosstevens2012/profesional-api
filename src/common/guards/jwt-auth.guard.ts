import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { JwtConfig } from "../../config/jwt.config";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly jwtConfig: JwtConfig;

  constructor(
    private readonly _jwtService: JwtService,
    private readonly _reflector: Reflector,
    configService: ConfigService
  ) {
    this.jwtConfig = configService.get<JwtConfig>("jwt")!;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this._reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException("Token de acceso requerido");
    }

    try {
      const payload = await this._jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.jwtConfig.secret,
      });
      request.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException("Token inválido o expirado");
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
