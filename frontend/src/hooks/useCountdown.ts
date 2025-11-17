import { useState, useEffect } from 'react'

/**
 * Возвращаемое значение хука useCountdown
 */
interface UseCountdownReturn {
  /** Оставшееся время в секундах */
  timeLeft: number
  /** Флаг истечения времени */
  isExpired: boolean
}

/**
 * Хук для обратного отсчета времени до целевой даты
 *
 * Обновляется каждую секунду
 *
 * @param targetDate - Целевая дата (Date или ISO строка)
 * @returns Объект с timeLeft (секунды) и isExpired (boolean)
 *
 * @example
 * const { timeLeft, isExpired } = useCountdown(round.startTime)
 *
 * if (!isExpired) {
 *   return <div>До начала: {formatCountdown(timeLeft)}</div>
 * }
 */
export const useCountdown = (targetDate: Date | string): UseCountdownReturn => {
  // Преобразуем targetDate в timestamp для стабильной зависимости
  const targetTimestamp = targetDate instanceof Date
    ? targetDate.getTime()
    : new Date(targetDate).getTime()

  const [timeLeft, setTimeLeft] = useState(() => {
    const now = Date.now()
    const diff = Math.floor((targetTimestamp - now) / 1000)
    return Math.max(0, diff)
  })

  useEffect(() => {
    // Обновление каждую секунду
    const interval = setInterval(() => {
      const now = Date.now()
      const diff = Math.floor((targetTimestamp - now) / 1000)
      setTimeLeft(Math.max(0, diff))
    }, 1000)

    return () => clearInterval(interval)
  }, [targetTimestamp]) // Используем timestamp вместо объекта Date

  return {
    timeLeft,
    isExpired: timeLeft <= 0,
  }
}
