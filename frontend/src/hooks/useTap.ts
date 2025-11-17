import { useState, useCallback } from 'react'
import { tapsService } from '@/services/taps.service'
import { showSuccess } from '@/utils/toast.utils'

/**
 * Возвращаемое значение хука useTap
 */
interface UseTapReturn {
  /** Функция для выполнения тапа */
  tap: () => Promise<void>
  /** Флаг выполнения запроса */
  isTapping: boolean
  /** Локальное количество тапов */
  localTaps: number
  /** Локальное количество очков */
  localPoints: number
}

/**
 * Хук для обработки тапов с оптимистичным обновлением UI
 *
 * @param roundId - UUID раунда
 * @param initialTaps - Начальное количество тапов (по умолчанию 0)
 * @param initialPoints - Начальное количество очков (по умолчанию 0)
 * @returns Объект с функцией tap и локальными счетчиками
 *
 * @example
 * const { tap, isTapping, localTaps, localPoints } = useTap(
 *   roundId,
 *   round.myStats?.taps,
 *   round.myStats?.points
 * )
 *
 * <button onClick={tap} disabled={isTapping}>
 *   Тапнуть гуся
 * </button>
 * <div>Тапов: {localTaps}, Очков: {localPoints}</div>
 */
export const useTap = (
  roundId: string,
  initialTaps = 0,
  initialPoints = 0
): UseTapReturn => {
  const [isTapping, setIsTapping] = useState(false)
  const [localTaps, setLocalTaps] = useState(initialTaps)
  const [localPoints, setLocalPoints] = useState(initialPoints)

  const tap = useCallback(async () => {
    // Защита от двойного клика
    if (isTapping) {
      return
    }

    setIsTapping(true)

    // Оптимистичное обновление UI
    setLocalTaps((prev) => prev + 1)

    try {
      const response = await tapsService.tap(roundId)

      // Синхронизация с сервером
      setLocalTaps(response.taps)
      setLocalPoints(response.points)

      // Показываем уведомление при бонусе
      if (response.earnedPoints === 10) {
        showSuccess('Бонус! +10 очков!', 1500)
      }
    } catch (err) {
      // Откат оптимистичного обновления при ошибке
      setLocalTaps((prev) => Math.max(0, prev - 1))
      console.error('Tap error:', err)
    } finally {
      setIsTapping(false)
    }
  }, [roundId, isTapping])

  return {
    tap,
    isTapping,
    localTaps,
    localPoints,
  }
}
