import axios, { type AxiosError } from 'axios'
import { showError } from '@/utils/toast.utils'

/**
 * Проверка наличия обязательной переменной окружения VITE_API_URL
 */
const API_URL = import.meta.env.VITE_API_URL

if (!API_URL) {
  throw new Error(
    '❌ VITE_API_URL не задан!\n\n' +
    'Создайте файл .env в корне frontend с содержимым:\n' +
    'VITE_API_URL=http://localhost/api\n\n' +
    'Или используйте один из готовых шаблонов:\n' +
    '  - cp .env.docker .env  (для Docker окружения)\n' +
    '  - cp .env.local .env   (для локальной разработки)'
  )
}

/**
 * Базовая конфигурация Axios instance
 */
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'application/json; charset=utf-8',
  },
  // Явно указываем что ответ в JSON с правильной кодировкой
  responseType: 'json',
})

/**
 * Request interceptor: автоматическая подстановка JWT токена
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

/**
 * Response interceptor: централизованная обработка ошибок
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    // Автоматический logout при 401 (кроме страницы логина)
    if (error.response?.status === 401) {
      const isLoginPage = window.location.pathname === '/login'

      if (!isLoginPage) {
        // Токен истек - делаем logout и редирект
        localStorage.removeItem('token')
        window.location.href = '/login'
        showError('Сессия истекла. Войдите снова')
      } else {
        // На странице логина - показываем сообщение от сервера
        const message = error.response.data?.message || error.response.data?.error
        showError(message || 'Ошибка авторизации')
      }

      return Promise.reject(error)
    }

    // Обработка других статусов
    if (error.response?.status === 403) {
      showError('Недостаточно прав для выполнения операции')
    } else if (error.response?.status === 429) {
      showError('Слишком много запросов. Подождите немного')
    } else if (error.response?.status === 400) {
      const message = error.response.data?.message || error.response.data?.error
      if (message) {
        showError(message)
      } else {
        showError('Некорректные данные запроса')
      }
    } else if (error.response?.status === 500) {
      showError('Ошибка сервера. Попробуйте позже')
    } else if (error.code === 'ECONNABORTED') {
      showError('Превышено время ожидания ответа')
    } else if (error.code === 'ERR_NETWORK') {
      showError('Ошибка сети. Проверьте подключение')
    } else {
      const message = error.response?.data?.message
      showError(message || 'Произошла непредвиденная ошибка')
    }

    return Promise.reject(error)
  }
)

export default api
