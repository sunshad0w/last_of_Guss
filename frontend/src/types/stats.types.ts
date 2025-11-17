/**
 * Статистика игрока в раунде
 */
export interface RoundStats {
  /** Количество тапов игрока */
  taps: number
  /** Количество очков игрока */
  points: number
}

/**
 * Информация о победителе раунда
 */
export interface Winner {
  /** Имя победителя */
  username: string
  /** Количество очков победителя */
  points: number
}

/**
 * Ответ сервера на тап
 */
export interface TapResponse {
  /** Обновленное количество тапов игрока */
  taps: number
  /** Обновленное количество очков игрока */
  points: number
  /** Количество очков, заработанных этим тапом (1 или 10) */
  earnedPoints: number
}
