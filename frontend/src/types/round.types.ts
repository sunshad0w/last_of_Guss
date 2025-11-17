import type { RoundStats, Winner } from './stats.types'

/**
 * Статусы раунда
 */
export type RoundStatus = 'cooldown' | 'active' | 'completed'

/**
 * Интерфейс раунда
 */
export interface Round {
  /** Уникальный идентификатор раунда (UUID) */
  id: string
  /** Время начала раунда (ISO 8601) */
  startTime: string
  /** Время окончания раунда (ISO 8601) */
  endTime: string
  /** Текущий статус раунда */
  status: RoundStatus
  /** Общее количество тапов в раунде */
  totalTaps: number
  /** Общее количество очков в раунде */
  totalPoints: number
  /** Статистика текущего пользователя (null если не участвовал) */
  myStats?: RoundStats | null
  /** Победитель раунда (только для completed раундов) */
  winner?: Winner | null
}

/**
 * DTO для создания нового раунда (только admin)
 */
export interface CreateRoundDto {
  /** Время начала раунда (ISO 8601) */
  startTime: string
}

/**
 * Ответ API со списком раундов
 */
export interface RoundsListResponse {
  /** Список раундов */
  rounds: Round[]
}
