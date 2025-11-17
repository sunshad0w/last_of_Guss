import type { User } from '@/types/user.types'

/**
 * Декодирует base64 строку с поддержкой UTF-8
 *
 * @param str - base64 строка
 * @returns Декодированная UTF-8 строка
 */
const base64UrlDecode = (str: string): string => {
  // Заменяем URL-safe символы на стандартные base64
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')

  // Декодируем base64 в бинарные данные
  const binaryString = atob(base64)

  // Преобразуем бинарные данные в массив байтов
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  // Декодируем UTF-8 байты в строку
  const decoder = new TextDecoder('utf-8')
  return decoder.decode(bytes)
}

/**
 * Декодирует JWT payload без проверки подписи
 *
 * @param token - JWT токен
 * @returns Декодированный payload или null при ошибке
 *
 * @example
 * const payload = decodeToken(token)
 * if (payload) {
 *   console.log(payload.userId)
 * }
 */
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const payload = parts[1]
    if (!payload) {
      return null
    }

    const decoded = base64UrlDecode(payload)
    return JSON.parse(decoded) as TokenPayload
  } catch {
    return null
  }
}

/**
 * Проверяет, истек ли срок действия токена
 *
 * @param token - JWT токен
 * @returns true если токен истек
 *
 * @example
 * if (isTokenExpired(token)) {
 *   logout()
 * }
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeToken(token)
  if (!payload?.exp) {
    return true
  }

  const now = Math.floor(Date.now() / 1000)
  return payload.exp < now
}

/**
 * Извлекает информацию о пользователе из токена
 *
 * @param token - JWT токен
 * @returns Объект пользователя или null
 *
 * @example
 * const user = getUserFromToken(token)
 * console.log(user?.username)
 */
export const getUserFromToken = (token: string): User | null => {
  const payload = decodeToken(token)
  if (!payload) {
    return null
  }

  return {
    id: payload.userId,
    username: payload.username,
    role: payload.role,
  }
}

/**
 * Интерфейс payload JWT токена
 */
interface TokenPayload {
  userId: string
  username: string
  role: 'survivor' | 'nikita' | 'admin'
  iat?: number
  exp?: number
}
