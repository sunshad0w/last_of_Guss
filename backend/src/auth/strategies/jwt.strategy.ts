import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

/**
 * JWT стратегия для аутентификации
 *
 * Извлекает токен из заголовка Authorization: Bearer <token>
 * Валидирует пользователя по ID из токена
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Валидирует payload JWT токена
   *
   * @param payload - Payload токена { sub: userId, username, role }
   * @returns Информация о пользователе
   * @throws UnauthorizedException - Если пользователь не найден
   */
  async validate(payload: { sub: string; username: string; role: string }) {
    const user = await this.authService.validateUser(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    return user;
  }
}
