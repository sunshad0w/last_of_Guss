import { createContext, useState, useEffect, type ReactNode } from 'react'
import type { User, LoginCredentials } from '@/types/user.types'
import { authService } from '@/services/auth.service'
import { getUserFromToken, isTokenExpired } from '@/utils/jwt.utils'
import { showSuccess } from '@/utils/toast.utils'

/**
 * Интерфейс контекста аутентификации
 */
interface AuthContextType {
  /** Текущий пользователь или null */
  user: User | null
  /** JWT токен или null */
  token: string | null
  /** Флаг аутентификации */
  isAuthenticated: boolean
  /** Флаг загрузки */
  isLoading: boolean
  /** Функция входа */
  login: (credentials: LoginCredentials) => Promise<void>
  /** Функция выхода */
  logout: () => void
}

/**
 * Контекст аутентификации
 */
export const AuthContext = createContext<AuthContextType | null>(null)

/**
 * Props для AuthProvider
 */
interface AuthProviderProps {
  children: ReactNode
}

/**
 * Provider контекста аутентификации
 *
 * @example
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Проверка наличия токена при монтировании
   */
  useEffect(() => {
    const storedToken = localStorage.getItem('token')

    if (storedToken && !isTokenExpired(storedToken)) {
      const userData = getUserFromToken(storedToken)
      if (userData) {
        setToken(storedToken)
        setUser(userData)
      } else {
        localStorage.removeItem('token')
      }
    } else {
      localStorage.removeItem('token')
    }

    setIsLoading(false)
  }, [])

  /**
   * Вход в систему
   */
  const login = async (credentials: LoginCredentials): Promise<void> => {
    const response = await authService.login(credentials)

    localStorage.setItem('token', response.accessToken)
    setToken(response.accessToken)
    setUser(response.user)

    showSuccess(`Добро пожаловать, ${response.user.username}!`)
  }

  /**
   * Выход из системы
   */
  const logout = (): void => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    showSuccess('Вы вышли из системы')
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
