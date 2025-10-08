import { Injectable } from "@nestjs/common";
import type {
  CreateUserDTO,
  UpdateUserDTO,
  User,
} from "@profesional/contracts";

@Injectable()
export class UsersService {
  private users: User[] = [
    {
      id: "1",
      email: "john@example.com",
      name: "John Doe",
      isActive: true,
      role: "client",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    {
      id: "2",
      email: "jane@example.com",
      name: "Jane Smith",
      isActive: true,
      role: "professional",
      createdAt: new Date("2024-01-02"),
      updatedAt: new Date("2024-01-02"),
    },
  ];

  create(createUserDto: CreateUserDTO): User {
    const newUser: User = {
      id: (this.users.length + 1).toString(),
      ...createUserDto,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  findAll(): User[] {
    return this.users;
  }

  findOne(id: string): User | null {
    return this.users.find(user => user.id === id) || null;
  }

  update(id: string, updateUserDto: UpdateUserDTO): User | null {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return null;
    }

    const updatedUser: User = {
      ...this.users[userIndex],
      ...updateUserDto,
      updatedAt: new Date(),
    };

    this.users[userIndex] = updatedUser;
    return updatedUser;
  }

  remove(id: string): { success: boolean } {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return { success: false };
    }

    this.users.splice(userIndex, 1);
    return { success: true };
  }
}
