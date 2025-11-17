import api from './api'
import type { LoginResponse, LoginCredentials } from '@/types/user.types'

/**
 * Сервис аутентификации
 */
export const authService = {
  /**
   * Авторизация пользователя (вход или регистрация)
   *
   * @param credentials - Данные для входа (username, password)
   * @returns Promise с токеном и данными пользователя
   *
   * @throws {AxiosError} При ошибке сети или неверных данных
   *
   * @example
   * const { accessToken, user } = await authService.login({
   *   username: 'admin',
   *   password: 'password123'
   * })
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials)
    return response.data
  },
}
