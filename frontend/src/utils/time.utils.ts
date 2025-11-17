/**
 * Вычисляет оставшееся время до целевой даты в секундах
 *
 * @param targetDate - Целевая дата
 * @returns Количество секунд до целевой даты (минимум 0)
 *
 * @example
 * const seconds = getTimeLeft(new Date('2025-11-17T15:00:00'))
 * console.log(seconds) // 3600
 */
export const getTimeLeft = (targetDate: Date | string): number => {
  const now = new Date().getTime()
  const target = new Date(targetDate).getTime()
  const diff = target - now

  return Math.max(0, Math.floor(diff / 1000))
}

/**
 * Форматирует секунды в формат MM:SS
 *
 * @param seconds - Количество секунд
 * @returns Строка в формате MM:SS
 *
 * @example
 * formatCountdown(125) // "02:05"
 * formatCountdown(45)  // "00:45"
 */
export const formatCountdown = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Форматирует дату в читаемый формат (DD.MM.YYYY, HH:MM:SS)
 *
 * @param date - Дата для форматирования
 * @returns Форматированная строка
 *
 * @example
 * formatDate(new Date('2025-11-17T15:00:00'))
 * // "17.11.2025, 15:00:00"
 */
export const formatDate = (date: Date | string): string => {
  const d = new Date(date)

  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()

  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const seconds = d.getSeconds().toString().padStart(2, '0')

  return `${day}.${month}.${year}, ${hours}:${minutes}:${seconds}`
}

/**
 * Создает дату через N минут от текущего момента
 *
 * @param minutes - Количество минут
 * @returns Объект Date
 *
 * @example
 * const futureDate = addMinutes(30)
 * // Дата через 30 минут
 */
export const addMinutes = (minutes: number): Date => {
  const now = new Date()
  return new Date(now.getTime() + minutes * 60 * 1000)
}

/**
 * Определяет статус раунда на основе времени
 *
 * @param startTime - Время начала раунда
 * @param endTime - Время окончания раунда
 * @returns Статус раунда
 *
 * @example
 * const status = getRoundStatus(startTime, endTime)
 * console.log(status) // "active" | "cooldown" | "completed"
 */
export const getRoundStatus = (
  startTime: Date | string,
  endTime: Date | string
): 'cooldown' | 'active' | 'completed' => {
  const now = new Date().getTime()
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()

  if (now < start) {
    return 'cooldown'
  }

  if (now >= start && now < end) {
    return 'active'
  }

  return 'completed'
}
