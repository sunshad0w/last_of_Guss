import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

/**
 * Сервис аутентификации
 *
 * Отвечает за:
 * - Создание/вход пользователей
 * - Генерацию JWT токенов
 * - Автоматическое назначение ролей
 */
@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Логин или регистрация пользователя
   *
   * @param loginDto - Данные для входа (username, password)
   * @returns JWT токен и информация о пользователе
   * @throws UnauthorizedException - Если пароль неверный
   *
   * @example
   * ```typescript
   * const result = await authService.login({ username: 'Иван', password: 'password123' });
   * // { accessToken: 'eyJhbGc...', user: { id: '...', username: 'Иван', role: 'SURVIVOR' } }
   * ```
   */
  async login(loginDto: LoginDto): Promise<{
    accessToken: string;
    user: { id: string; username: string; role: UserRole };
  }> {
    const { username, password } = loginDto;

    // Проверяем, существует ли пользователь
    let user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (user) {
      // Пользователь существует - проверяем пароль
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Неверный пароль');
      }
    } else {
      // Пользователь не существует - создаем нового
      const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);
      const role = this.determineUserRole(username);

      user = await this.prisma.user.create({
        data: {
          username,
          passwordHash,
          role,
        },
      });
    }

    // Генерируем JWT токен
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  /**
   * Определяет роль пользователя на основе username
   *
   * @param username - Имя пользователя
   * @returns Роль пользователя
   *
   * Правила:
   * - username === "admin" → ADMIN
   * - username === "Никита" → NIKITA
   * - все остальные → SURVIVOR
   */
  private determineUserRole(username: string): UserRole {
    if (username === 'admin') {
      return UserRole.ADMIN;
    }
    if (username === 'Никита') {
      return UserRole.NIKITA;
    }
    return UserRole.SURVIVOR;
  }

  /**
   * Валидирует пользователя по ID (используется в JWT стратегии)
   *
   * @param userId - ID пользователя из JWT токена
   * @returns Информация о пользователе или null
   */
  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });
  }
}
