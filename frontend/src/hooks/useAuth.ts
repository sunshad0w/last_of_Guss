import { useContext } from 'react'
import { AuthContext } from '@/context/AuthContext'

/**
 * Хук для доступа к контексту аутентификации
 *
 * @throws {Error} Если используется вне AuthProvider
 *
 * @returns Контекст аутентификации
 *
 * @example
 * const { user, isAuthenticated, login, logout } = useAuth()
 *
 * if (user?.role === 'ADMIN') {
 *   // Показать кнопку создания раунда
 * }
 */
export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
