import type { User } from '@/types/user.types'

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

    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
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
