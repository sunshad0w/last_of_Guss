import { useState, useEffect, useCallback } from 'react'
import { roundsService } from '@/services/rounds.service'
import type { Round } from '@/types/round.types'

/**
 * Возвращаемое значение хука useRound
 */
interface UseRoundReturn {
  /** Данные раунда или null */
  round: Round | null
  /** Флаг загрузки */
  loading: boolean
  /** Текст ошибки или null */
  error: string | null
  /** Функция для ручного обновления данных */
  refetch: () => Promise<void>
}

/**
 * Хук для загрузки данных раунда с автоматическим обновлением
 *
 * Обновляет данные каждые 2 секунды
 *
 * @param roundId - UUID раунда
 * @returns Объект с данными раунда, статусами загрузки и функцией refetch
 *
 * @example
 * const { round, loading, error, refetch } = useRound(roundId)
 *
 * if (loading) return <div>Загрузка...</div>
 * if (error) return <div>Ошибка: {error}</div>
 * return <div>{round.status}</div>
 */
export const useRound = (roundId: string): UseRoundReturn => {
  const [round, setRound] = useState<Round | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRound = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await roundsService.getRoundById(roundId)
      setRound(data)
    } catch (err) {
      setError('Не удалось загрузить данные раунда')
      console.error('Error fetching round:', err)
    } finally {
      setLoading(false)
    }
  }, [roundId])

  useEffect(() => {
    // Первичная загрузка
    fetchRound()

    // Автообновление каждые 2 секунды
    const interval = setInterval(fetchRound, 2000)

    return () => clearInterval(interval)
  }, [fetchRound])

  return {
    round,
    loading,
    error,
    refetch: fetchRound,
  }
}
