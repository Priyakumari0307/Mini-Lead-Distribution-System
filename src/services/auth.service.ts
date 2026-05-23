import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { AppError } from '../utils/errors';
import { User, Role } from '@prisma/client';

export class AuthService {
  /**
   * Registers a new user.
   */
  public static async register(data: { name: string; email: string; password: string; role?: Role }): Promise<Omit<User, 'password'>> {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError('Email is already registered', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || 'SALES',
      },
    });

    const { password, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Log in user and generate JWT.
   */
  public static async login(data: { email: string; password: string }): Promise<{ token: string; user: Omit<User, 'password'> }> {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpire as any }
    );

    const { password, ...safeUser } = user;
    return { token, user: safeUser };
  }
}
