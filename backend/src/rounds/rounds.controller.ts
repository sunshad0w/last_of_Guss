import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RoundsService } from './rounds.service';
import { CreateRoundDto } from './dto/create-round.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

/**
 * Контроллер раундов
 *
 * Эндпоинты:
 * - GET /rounds - Получить список всех раундов
 * - POST /rounds - Создать новый раунд (только admin)
 * - GET /rounds/:id - Получить детальную информацию о раунде
 */
@Controller('rounds')
@UseGuards(JwtAuthGuard)
export class RoundsController {
  constructor(private readonly roundsService: RoundsService) {}

  /**
   * Создать новый раунд
   *
   * Доступно только для администраторов
   *
   * @param createRoundDto - Данные для создания раунда
   * @returns Созданный раунд
   *
   * @example
   * POST /rounds
   * Authorization: Bearer <admin_token>
   * {
   *   "startTime": "2025-11-17T15:00:00.000Z"
   * }
   *
   * Response (201):
   * {
   *   "id": "uuid",
   *   "startTime": "2025-11-17T15:00:00.000Z",
   *   "endTime": "2025-11-17T15:01:00.000Z",
   *   "status": "cooldown",
   *   "totalTaps": 0,
   *   "totalPoints": 0,
   *   "createdAt": "2025-11-17T14:59:00.000Z"
   * }
   */
  @Post()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createRoundDto: CreateRoundDto) {
    return this.roundsService.create(createRoundDto);
  }

  /**
   * Получить список всех раундов
   *
   * @returns Список раундов, отсортированных по статусу и времени
   *
   * @example
   * GET /rounds
   * Authorization: Bearer <token>
   *
   * Response (200):
   * {
   *   "rounds": [
   *     {
   *       "id": "uuid",
   *       "startTime": "2025-11-17T15:00:00.000Z",
   *       "endTime": "2025-11-17T15:01:00.000Z",
   *       "status": "active",
   *       "totalTaps": 123,
   *       "totalPoints": 145
   *     }
   *   ]
   * }
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(
    @CurrentUser() user: { id: string; username: string; role: UserRole },
  ) {
    return this.roundsService.findAll(user.id);
  }

  /**
   * Получить детальную информацию о раунде
   *
   * @param id - ID раунда
   * @param user - Текущий пользователь (из JWT токена)
   * @returns Детальная информация о раунде с личной статистикой
   *
   * @example
   * GET /rounds/:id
   * Authorization: Bearer <token>
   *
   * Response (200) - Active/Cooldown:
   * {
   *   "id": "uuid",
   *   "startTime": "2025-11-17T15:00:00.000Z",
   *   "endTime": "2025-11-17T15:01:00.000Z",
   *   "status": "active",
   *   "totalTaps": 450,
   *   "totalPoints": 520,
   *   "myStats": {
   *     "taps": 25,
   *     "points": 27
   *   }
   * }
   *
   * Response (200) - Completed:
   * {
   *   "id": "uuid",
   *   "startTime": "2025-11-17T15:00:00.000Z",
   *   "endTime": "2025-11-17T15:01:00.000Z",
   *   "status": "completed",
   *   "totalTaps": 999,
   *   "totalPoints": 1234,
   *   "winner": {
   *     "username": "Иван",
   *     "points": 105
   *   },
   *   "myStats": {
   *     "taps": 42,
   *     "points": 45
   *   }
   * }
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; username: string; role: UserRole },
  ) {
    return this.roundsService.findOne(id, user.id);
  }
}
