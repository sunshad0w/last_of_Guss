import { toast } from 'sonner'

/**
 * Показывает toast уведомление об успехе
 *
 * @param message - Текст сообщения
 * @param duration - Длительность показа в миллисекундах (по умолчанию 2000)
 *
 * @example
 * showSuccess('Вход выполнен успешно')
 */
export const showSuccess = (message: string, duration = 2000): void => {
  toast.success(message, {
    duration,
    position: 'top-right',
  })
}

/**
 * Показывает toast уведомление об ошибке
 *
 * @param message - Текст сообщения
 * @param duration - Длительность показа в миллисекундах (по умолчанию 3000)
 *
 * @example
 * showError('Не удалось загрузить данные')
 */
export const showError = (message: string, duration = 3000): void => {
  toast.error(message, {
    duration,
    position: 'top-right',
  })
}

/**
 * Показывает toast уведомление с информацией
 *
 * @param message - Текст сообщения
 * @param duration - Длительность показа в миллисекундах (по умолчанию 2000)
 *
 * @example
 * showInfo('Раунд начнется через 30 секунд')
 */
export const showInfo = (message: string, duration = 2000): void => {
  toast.info(message, {
    duration,
    position: 'top-right',
  })
}

/**
 * Показывает toast предупреждение
 *
 * @param message - Текст сообщения
 * @param duration - Длительность показа в миллисекундах (по умолчанию 2500)
 *
 * @example
 * showWarning('До конца раунда осталось 10 секунд!')
 */
export const showWarning = (message: string, duration = 2500): void => {
  toast.warning(message, {
    duration,
    position: 'top-right',
  })
}
