import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoundDto } from './dto/create-round.dto';
import { RoundStatus, UserRole } from '@prisma/client';

/**
 * Сервис для управления раундами
 *
 * Отвечает за:
 * - Создание раундов (только для администраторов)
 * - Получение списка раундов с правильной сортировкой
 * - Получение детальной информации о раунде
 * - Определение текущего статуса раунда
 * - Определение победителя завершенного раунда
 */
@Injectable()
export class RoundsService {
  private readonly ROUND_DURATION: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.ROUND_DURATION = this.configService.get<number>('ROUND_DURATION', 60);
  }

  /**
   * Создает новый раунд
   *
   * @param createRoundDto - Данные для создания раунда (startTime)
   * @returns Созданный раунд
   * @throws BadRequestException - Если время старта в прошлом
   *
   * Автоматически рассчитывает:
   * - endTime = startTime + ROUND_DURATION
   * - status = COOLDOWN (если startTime в будущем)
   *
   * @example
   * ```typescript
   * const round = await roundsService.create({
   *   startTime: '2025-11-17T15:00:00.000Z'
   * });
   * ```
   */
  async create(createRoundDto: CreateRoundDto) {
    const startTime = new Date(createRoundDto.startTime);
    const now = new Date();

    // Проверка: время старта не должно быть в прошлом
    if (startTime < now) {
      throw new BadRequestException('Время старта не может быть в прошлом');
    }

    // Рассчитываем endTime
    const endTime = new Date(startTime.getTime() + this.ROUND_DURATION * 1000);

    // Создаем раунд
    const round = await this.prisma.round.create({
      data: {
        startTime,
        endTime,
        status: RoundStatus.COOLDOWN,
        totalTaps: 0,
        totalPoints: 0,
      },
    });

    return {
      id: round.id,
      startTime: round.startTime,
      endTime: round.endTime,
      status: this.determineRoundStatus(round.startTime, round.endTime),
      totalTaps: round.totalTaps,
      totalPoints: round.totalPoints,
      createdAt: round.createdAt,
    };
  }

  /**
   * Получает список всех раундов с правильной сортировкой
   *
   * Сортировка:
   * 1. По статусу: active → cooldown → completed
   * 2. Внутри группы: по времени старта (DESC)
   *
   * @param userId - ID текущего пользователя
   * @returns Список раундов с информацией об участии текущего пользователя
   *
   * @example
   * ```typescript
   * const { rounds } = await roundsService.findAll('user-id');
   * // [
   * //   { id: '...', status: 'active', myStats: { taps: 10, points: 12 }, ... },
   * //   { id: '...', status: 'cooldown', myStats: null, ... },
   * //   { id: '...', status: 'completed', winner: {...}, myStats: {...}, ... }
   * // ]
   * ```
   */
  async findAll(userId: string) {
    const rounds = await this.prisma.round.findMany({
      orderBy: [{ startTime: 'desc' }],
      include: {
        roundStats: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // Определяем актуальный статус для каждого раунда
    const roundsWithStatus = rounds.map((round) => {
      const status = this.determineRoundStatus(round.startTime, round.endTime);

      // Получаем личную статистику пользователя
      const myStats = round.roundStats.find((stat) => stat.userId === userId);

      const result = {
        id: round.id,
        startTime: round.startTime,
        endTime: round.endTime,
        status,
        totalTaps: round.totalTaps,
        totalPoints: round.totalPoints,
        myStats: myStats
          ? {
              taps: myStats.taps,
              points: myStats.points,
            }
          : null,
        winner: undefined as { username: string; points: number } | null | undefined,
      };

      // Если раунд завершен - добавляем информацию о победителе
      if (status === 'completed') {
        result.winner = this.determineWinner(round.roundStats);
      }

      return result;
    });

    // Сортируем: active → cooldown → completed, внутри группы по времени
    const statusOrder: Record<'active' | 'cooldown' | 'completed', number> = {
      active: 1,
      cooldown: 2,
      completed: 3
    };
    roundsWithStatus.sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      return b.startTime.getTime() - a.startTime.getTime();
    });

    return { rounds: roundsWithStatus };
  }

  /**
   * Получает детальную информацию о раунде
   *
   * @param id - ID раунда
   * @param userId - ID текущего пользователя
   * @returns Детальная информация о раунде с личной статистикой
   * @throws NotFoundException - Если раунд не найден
   *
   * Для завершенного раунда возвращает информацию о победителе
   * Для активного/cooldown раунда - только личную статистику
   *
   * @example
   * ```typescript
   * const round = await roundsService.findOne('uuid', 'user-id');
   * // {
   * //   id: 'uuid',
   * //   status: 'completed',
   * //   winner: { username: 'Иван', points: 105 },
   * //   myStats: { taps: 42, points: 45 }
   * // }
   * ```
   */
  async findOne(id: string, userId: string) {
    const round = await this.prisma.round.findUnique({
      where: { id },
      include: {
        roundStats: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!round) {
      throw new NotFoundException('Раунд не найден');
    }

    const status = this.determineRoundStatus(round.startTime, round.endTime);

    // Получаем личную статистику пользователя
    const myStats = round.roundStats.find((stat) => stat.userId === userId);

    const result: any = {
      id: round.id,
      startTime: round.startTime,
      endTime: round.endTime,
      status,
      totalTaps: round.totalTaps,
      totalPoints: round.totalPoints,
      myStats: myStats
        ? {
            taps: myStats.taps,
            points: myStats.points,
          }
        : null,
    };

    // Если раунд завершен - добавляем информацию о победителе
    if (status === 'completed') {
      result.winner = this.determineWinner(round.roundStats);
    }

    return result;
  }

  /**
   * Определяет текущий статус раунда на основе времени
   *
   * @param startTime - Время начала раунда
   * @param endTime - Время окончания раунда
   * @returns Статус раунда: 'cooldown' | 'active' | 'completed'
   *
   * Логика:
   * - currentTime < startTime → cooldown
   * - startTime ≤ currentTime < endTime → active
   * - currentTime ≥ endTime → completed
   */
  private determineRoundStatus(
    startTime: Date,
    endTime: Date,
  ): 'cooldown' | 'active' | 'completed' {
    const now = new Date();

    if (now < startTime) {
      return 'cooldown';
    }
    if (now >= startTime && now < endTime) {
      return 'active';
    }
    return 'completed';
  }

  /**
   * Определяет победителя раунда
   *
   * @param stats - Статистика всех игроков в раунде
   * @returns Информация о победителе или null
   *
   * Критерии победы:
   * 1. Максимальное количество очков
   * 2. При равенстве очков - минимальное количество тапов (эффективность)
   * 3. При полном равенстве - первый по времени создания записи
   * 4. Игрок с ролью NIKITA не может быть победителем
   */
  private determineWinner(
    stats: Array<{
      userId: string;
      taps: number;
      points: number;
      createdAt: Date;
      user: { username: string; role: UserRole };
    }>,
  ): { username: string; points: number } | null {
    // Фильтруем только обычных игроков (исключаем NIKITA)
    const eligibleStats = stats.filter((stat) => stat.user.role !== UserRole.NIKITA);

    if (eligibleStats.length === 0) {
      return null;
    }

    // Сортируем по: 1) очкам (DESC), 2) тапам (ASC), 3) времени создания (ASC)
    const sorted = [...eligibleStats].sort((a, b) => {
      if (a.points !== b.points) {
        return b.points - a.points; // Больше очков = лучше
      }
      if (a.taps !== b.taps) {
        return a.taps - b.taps; // Меньше тапов = эффективнее
      }
      return a.createdAt.getTime() - b.createdAt.getTime(); // Раньше = лучше
    });

    const winner = sorted[0];
    return {
      username: winner.user.username,
      points: winner.points,
    };
  }
}
