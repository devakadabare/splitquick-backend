import bcrypt from 'bcrypt';
import prisma from '../../config/database';
import { generateToken } from '../../config/jwt';

export class AuthService {
  async register(name: string, email: string, password: string) {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser && !existingUser.isGuest) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let user;
    if (existingUser && existingUser.isGuest) {
      // Upgrade guest to full user
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: { name, passwordHash, isGuest: false }
      });
    } else {
      user = await prisma.user.create({
        data: { name, email, passwordHash }
      });
    }

    const token = generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token
    };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.passwordHash) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token
    };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email
    };
  }
}
