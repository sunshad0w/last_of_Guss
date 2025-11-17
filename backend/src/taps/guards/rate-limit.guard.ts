import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Guard для ограничения частоты тапов
 *
 * Лимит: максимум N тапов в секунду на пользователя
 * Реализация: in-memory Map с TTL
 *
 * ВАЖНО: Для production окружения с несколькими инстансами
 * рекомендуется использовать Redis вместо in-memory кеша
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly tapsPerSecond: number;
  private readonly userTaps: Map<
    string,
    { count: number; resetAt: number }
  > = new Map();
  private readonly WINDOW_MS = 1000; // 1 секунда

  constructor(private readonly configService: ConfigService) {
    this.tapsPerSecond = this.configService.get<number>(
      'RATE_LIMIT_TAPS_PER_SECOND',
      10,
    );

    // Очистка устаревших записей каждую секунду
    setInterval(() => this.cleanup(), 1000);
  }

  /**
   * Проверяет, не превышен ли лимит тапов
   *
   * @param context - Контекст выполнения
   * @returns true если лимит не превышен, иначе выбрасывает 429 ошибку
   * @throws HttpException (429) - Если превышен лимит
   *
   * Алгоритм:
   * 1. Извлекаем userId из request.user
   * 2. Проверяем количество тапов в текущем окне
   * 3. Если лимит превышен - возвращаем 429
   * 4. Иначе увеличиваем счетчик и разрешаем запрос
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      // Если нет userId (не авторизован), пропускаем guard
      // (проверка авторизации должна быть в JwtAuthGuard)
      return true;
    }

    const now = Date.now();
    const userKey = userId;

    // Получаем или создаем запись для пользователя
    let userRecord = this.userTaps.get(userKey);

    // Если запись устарела или не существует - создаем новую
    if (!userRecord || now >= userRecord.resetAt) {
      userRecord = {
        count: 0,
        resetAt: now + this.WINDOW_MS,
      };
      this.userTaps.set(userKey, userRecord);
    }

    // Проверяем лимит
    if (userRecord.count >= this.tapsPerSecond) {
      throw new HttpException(
        'Слишком много запросов. Максимум 10 тапов в секунду',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Увеличиваем счетчик
    userRecord.count++;

    return true;
  }

  /**
   * Очистка устаревших записей
   *
   * Удаляет записи, у которых истек таймаут
   * Вызывается каждую секунду для предотвращения утечек памяти
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.userTaps.entries()) {
      if (now >= record.resetAt) {
        this.userTaps.delete(key);
      }
    }
  }
}
