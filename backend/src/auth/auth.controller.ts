import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

/**
 * Контроллер аутентификации
 *
 * Эндпоинты:
 * - POST /auth/login - Вход или регистрация пользователя
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Вход или регистрация пользователя
   *
   * @param loginDto - Данные для входа
   * @returns JWT токен и информация о пользователе
   *
   * @example
   * POST /auth/login
   * {
   *   "username": "Иван",
   *   "password": "password123"
   * }
   *
   * Response:
   * {
   *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "user": {
   *     "id": "uuid",
   *     "username": "Иван",
   *     "role": "SURVIVOR"
   *   }
   * }
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
