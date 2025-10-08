import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";

// eslint-disable-next-line no-unused-vars
export enum Role {
  // eslint-disable-next-line no-unused-vars
  ADMIN = "admin",
  // eslint-disable-next-line no-unused-vars
  PROFESSIONAL = "professional",
  // eslint-disable-next-line no-unused-vars
  CLIENT = "client",
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly _reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this._reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }

    return requiredRoles.includes(user.role as Role);
  }
}
