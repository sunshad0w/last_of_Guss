import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

/**
 * Сервис обработки тапов
 *
 * КРИТИЧЕСКИ ВАЖНЫЙ МОДУЛЬ!
 *
 * Отвечает за:
 * - Атомарную обработку тапов с использованием транзакций Prisma
 * - Правильный расчет бонусных очков (каждый 11-й тап)
 * - Обработку роли Никита (тапы без очков)
 * - Grace period для тапов (1 секунда после endTime)
 * - Гарантию консистентности данных при конкурентных запросах
 */
@Injectable()
export class TapsService {
  private readonly BONUS_TAP_DIVISOR = 11; // Каждый 11-й тап
  private readonly BONUS_POINTS = 10; // Бонусные очки
  private readonly REGULAR_POINTS = 1; // Обычные очки
  private readonly GRACE_PERIOD_MS = 1000; // 1 секунда

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Обрабатывает тап по гусю
   *
   * ВАЖНО: Используется Prisma $transaction для атомарности операций
   * Это критично для предотвращения race conditions при конкурентных запросах
   *
   * @param roundId - ID раунда
   * @param userId - ID пользователя
   * @param userRole - Роль пользователя
   * @returns Результат тапа (taps, points, earnedPoints, isBonus)
   * @throws NotFoundException - Если раунд не найден
   * @throws BadRequestException - Если раунд неактивен
   *
   * Алгоритм:
   * 1. Проверяем существование и статус раунда
   * 2. В транзакции:
   *    a) Обновляем/создаем статистику игрока
   *    b) Обновляем общую статистику раунда
   *    c) Рассчитываем бонусные очки на основе ГЛОБАЛЬНОГО счетчика
   * 3. Возвращаем актуальные данные игрока
   *
   * @example
   * ```typescript
   * const result = await tapsService.processTap('round-id', 'user-id', UserRole.SURVIVOR);
   * // {
   * //   taps: 26,
   * //   points: 28,
   * //   earnedPoints: 1,
   * //   isBonus: false
   * // }
   * ```
   */
  async processTap(
    roundId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<{
    taps: number;
    points: number;
    earnedPoints: number;
    isBonus: boolean;
  }> {
    // Проверяем существование раунда и его статус
    const round = await this.prisma.round.findUnique({
      where: { id: roundId },
    });

    if (!round) {
      throw new NotFoundException('Раунд не найден');
    }

    // Проверяем, что раунд активен (с учетом grace period)
    const now = new Date();
    const graceEndTime = new Date(round.endTime.getTime() + this.GRACE_PERIOD_MS);

    if (now < round.startTime || now >= graceEndTime) {
      throw new BadRequestException('Раунд неактивен');
    }

    // Используем транзакцию для атомарной обработки тапа
    // Это критично для предотвращения race conditions!
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Получаем текущую статистику раунда для расчета бонуса
      // ВАЖНО: Читаем ДО обновления, чтобы правильно определить бонусный тап
      const currentRound = await tx.round.findUnique({
        where: { id: roundId },
        select: { totalTaps: true },
      });

      if (!currentRound) {
        throw new NotFoundException('Раунд не найден');
      }

      // 2. Рассчитываем новый номер тапа (ГЛОБАЛЬНЫЙ счетчик)
      const newTotalTaps = currentRound.totalTaps + 1;

      // 3. Определяем, является ли этот тап бонусным
      const isBonus = newTotalTaps % this.BONUS_TAP_DIVISOR === 0;
      const earnedPoints = isBonus ? this.BONUS_POINTS : this.REGULAR_POINTS;

      // 4. Рассчитываем очки с учетом роли Никита
      const pointsToAdd = userRole === UserRole.NIKITA ? 0 : earnedPoints;
      const totalPointsToAdd = userRole === UserRole.NIKITA ? 0 : earnedPoints;

      // 5. Обновляем статистику игрока (upsert для создания/обновления)
      const playerStats = await tx.roundStats.upsert({
        where: {
          roundId_userId: {
            roundId,
            userId,
          },
        },
        update: {
          taps: { increment: 1 },
          points: { increment: pointsToAdd },
        },
        create: {
          roundId,
          userId,
          taps: 1,
          points: pointsToAdd,
        },
      });

      // 6. Обновляем общую статистику раунда
      await tx.round.update({
        where: { id: roundId },
        data: {
          totalTaps: { increment: 1 },
          totalPoints: { increment: totalPointsToAdd },
        },
      });

      // 7. Возвращаем результат
      return {
        taps: playerStats.taps,
        points: playerStats.points,
        earnedPoints: pointsToAdd,
        isBonus,
      };
    });

    return result;
  }
}
