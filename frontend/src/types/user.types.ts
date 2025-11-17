/**
 * Роли пользователей в системе
 */
export type Role = 'SURVIVOR' | 'NIKITA' | 'ADMIN'

/**
 * Интерфейс пользователя
 */
export interface User {
  /** Уникальный идентификатор пользователя */
  id: string
  /** Имя пользователя (уникальное, регистрозависимое) */
  username: string
  /** Роль пользователя */
  role: Role
}

/**
 * Ответ от сервера при успешной аутентификации
 */
export interface LoginResponse {
  /** JWT токен для авторизации */
  accessToken: string
  /** Информация о пользователе */
  user: User
}

/**
 * Данные для авторизации
 */
export interface LoginCredentials {
  /** Имя пользователя */
  username: string
  /** Пароль (минимум 8 символов) */
  password: string
}
