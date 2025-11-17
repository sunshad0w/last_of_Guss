import api from './api'
import type { TapResponse } from '@/types/stats.types'

/**
 * Сервис для работы с тапами
 */
export const tapsService = {
  /**
   * Выполнить тап по гусю в активном раунде
   *
   * @param roundId - UUID раунда
   * @returns Promise с обновленной статистикой игрока
   *
   * @throws {AxiosError} 400 если раунд не активен
   * @throws {AxiosError} 429 если превышен rate limit (10 тапов/сек)
   *
   * @example
   * const { taps, points, earnedPoints } = await tapsService.tap(roundId)
   * console.log(`Тапов: ${taps}, Очков: ${points}`)
   * if (earnedPoints === 10) {
   *   console.log('Бонус! +10 очков!')
   * }
   */
  async tap(roundId: string): Promise<TapResponse> {
    const response = await api.post<TapResponse>(`/rounds/${roundId}/tap`)
    return response.data
  },
}
