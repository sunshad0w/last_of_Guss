import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Утилита для объединения и мержа CSS классов
 *
 * @param inputs - Классы для объединения
 * @returns Объединенная строка классов
 *
 * @example
 * cn('text-red-500', 'bg-blue-500') // 'text-red-500 bg-blue-500'
 * cn('text-red-500', condition && 'bg-blue-500') // условное применение
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
