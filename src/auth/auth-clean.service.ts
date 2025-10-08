import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Role } from "../common";

@Injectable()
export class AuthService {
  constructor(private readonly _jwtService: JwtService) {}

  async validateUser(email: string, password: string): Promise<any> {
    // TODO: Implement actual user validation with database
    // For now, return a mock user for demo purposes
    if (email === "admin@test.com" && password === "admin123") {
      return {
        id: "1",
        email: "admin@test.com",
        name: "Admin User",
        roles: [Role.ADMIN],
      };
    }

    if (email === "pro@test.com" && password === "pro123") {
      return {
        id: "2",
        email: "pro@test.com",
        name: "Professional User",
        roles: [Role.PROFESSIONAL],
      };
    }

    if (email === "user@test.com" && password === "user123") {
      return {
        id: "3",
        email: "user@test.com",
        name: "Customer User",
        roles: [Role.CLIENT],
      };
    }

    return null;
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles || [Role.CLIENT],
    };

    return {
      access_token: this._jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
    };
  }
}
