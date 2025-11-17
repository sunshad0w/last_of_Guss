import api from './api'
import type { Round, CreateRoundDto, RoundsListResponse } from '@/types/round.types'

/**
 * Сервис для работы с раундами
 */
export const roundsService = {
  /**
   * Получить список всех раундов
   *
   * @returns Promise со списком раундов
   *
   * @example
   * const rounds = await roundsService.getRounds()
   * console.log(rounds.length)
   */
  async getRounds(): Promise<Round[]> {
    const response = await api.get<RoundsListResponse>('/rounds')
    return response.data.rounds
  },

  /**
   * Получить детали конкретного раунда
   *
   * @param id - UUID раунда
   * @returns Promise с данными раунда
   *
   * @example
   * const round = await roundsService.getRoundById('uuid-here')
   * console.log(round.status)
   */
  async getRoundById(id: string): Promise<Round> {
    const response = await api.get<Round>(`/rounds/${id}`)
    return response.data
  },

  /**
   * Создать новый раунд (только для admin)
   *
   * @param dto - Данные для создания раунда
   * @returns Promise с созданным раундом
   *
   * @throws {AxiosError} 403 если у пользователя нет прав admin
   *
   * @example
   * const newRound = await roundsService.createRound({
   *   startTime: new Date(Date.now() + 120000).toISOString()
   * })
   */
  async createRound(dto: CreateRoundDto): Promise<Round> {
    const response = await api.post<Round>('/rounds', dto)
    return response.data
  },
}
