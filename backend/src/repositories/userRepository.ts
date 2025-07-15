import { prisma } from '../lib/database';
import { User, CreateUserRequest } from '../types/models';
import bcrypt from 'bcryptjs';

export class UserRepository {
  async findAll(): Promise<User[]> {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return users;
  }

  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }

  async findByEmailWithPassword(email: string) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  async create(userData: CreateUserRequest): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = await prisma.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        displayName: userData.displayName,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return user;
  }

  async update(id: string, userData: Partial<CreateUserRequest>): Promise<User | null> {
    const updateData: any = { ...userData };
    
    // Hash password if provided
    if (userData.password) {
      updateData.password = await bcrypt.hash(userData.password, 10);
    }

    try {
      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return user;
    } catch (error) {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { id },
    });
    return count > 0;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { email },
    });
    return count > 0;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { username },
    });
    return count > 0;
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmailWithPassword(email);
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUsersForAssignment(excludeId?: string): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: excludeId ? { id: { not: excludeId } } : undefined,
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        displayName: 'asc',
      },
    });
    return users;
  }
}