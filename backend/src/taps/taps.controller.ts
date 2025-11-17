import {
  Controller,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TapsService } from './taps.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

/**
 * Контроллер тапов
 *
 * Эндпоинты:
 * - POST /rounds/:id/tap - Зарегистрировать тап по гусю
 *
 * ВАЖНО: Порядок guards имеет значение!
 * 1. JwtAuthGuard - проверка авторизации
 * 2. RateLimitGuard - проверка частоты запросов
 */
@Controller('rounds')
@UseGuards(JwtAuthGuard, RateLimitGuard)
export class TapsController {
  constructor(private readonly tapsService: TapsService) {}

  /**
   * Зарегистрировать тап по гусю
   *
   * @param id - ID раунда
   * @param user - Текущий пользователь (из JWT токена)
   * @returns Результат тапа (taps, points, earnedPoints, isBonus)
   *
   * Защита:
   * - Требуется авторизация (JWT token)
   * - Ограничение: максимум 10 тапов в секунду
   *
   * @example
   * POST /rounds/:id/tap
   * Authorization: Bearer <token>
   *
   * Response (200) - Обычный тап:
   * {
   *   "taps": 26,
   *   "points": 28,
   *   "earnedPoints": 1,
   *   "isBonus": false
   * }
   *
   * Response (200) - Бонусный тап (каждый 11-й глобально):
   * {
   *   "taps": 33,
   *   "points": 50,
   *   "earnedPoints": 10,
   *   "isBonus": true
   * }
   *
   * Response (200) - Никита (фантомные тапы):
   * {
   *   "taps": 100,
   *   "points": 0,
   *   "earnedPoints": 0,
   *   "isBonus": false
   * }
   *
   * Response (400) - Раунд неактивен:
   * {
   *   "statusCode": 400,
   *   "message": "Раунд неактивен",
   *   "error": "Bad Request"
   * }
   *
   * Response (429) - Превышен лимит:
   * {
   *   "statusCode": 429,
   *   "message": "Слишком много запросов. Максимум 10 тапов в секунду"
   * }
   */
  @Post(':id/tap')
  @HttpCode(HttpStatus.OK)
  async tap(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; username: string; role: UserRole },
  ) {
    return this.tapsService.processTap(id, user.id, user.role);
  }
}
