import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import { roundsService } from '@/services/rounds.service'
import { toast } from 'sonner'

/**
 * Свойства компонента CreateRoundButton
 */
export interface CreateRoundButtonProps {
  /** Callback при успешном создании раунда */
  onCreated?: () => void
  /** Дополнительные CSS классы */
  className?: string
}

/**
 * Компонент кнопки создания нового раунда (только для администраторов)
 *
 * Отображает кнопку, которая открывает модальное окно с формой для создания раунда.
 * Администратор может указать точное время начала раунда.
 * Компонент автоматически скрывается, если пользователь не является админом.
 *
 * @param onCreated - Callback функция, вызываемая после успешного создания раунда
 * @param className - Дополнительные CSS классы
 *
 * @example
 * <CreateRoundButton onCreated={fetchRounds} />
 */
export const CreateRoundButton = React.memo<CreateRoundButtonProps>(({ onCreated, className }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [startDateTime, setStartDateTime] = React.useState('')

  // Если пользователь не админ, не отображаем компонент
  if (user?.role !== 'ADMIN') {
    return null
  }

  /**
   * Обработчик отправки формы создания раунда
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!startDateTime) {
      toast.error('Укажите время начала раунда')
      return
    }

    const startTime = new Date(startDateTime)
    const now = new Date()

    // Валидация: время начала должно быть в будущем
    if (startTime <= now) {
      toast.error('Время начала должно быть в будущем')
      return
    }

    // Валидация: не более чем за 24 часа
    const maxFutureTime = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    if (startTime > maxFutureTime) {
      toast.error('Раунд можно создать не более чем на 24 часа вперед')
      return
    }

    setLoading(true)

    try {
      const newRound = await roundsService.createRound({
        startTime: startTime.toISOString(),
      })

      toast.success('Раунд успешно создан!')
      setOpen(false)
      setStartDateTime('')

      // Вызываем callback для обновления списка раундов
      if (onCreated) {
        onCreated()
      }

      // Навигация на страницу созданного раунда
      navigate(`/rounds/${newRound.id}`)
    } catch (error) {
      // Ошибка уже обработана в axios interceptor
      console.error('Failed to create round:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Генерирует значение datetime-local на 2 минуты вперед
   */
  const getMinDateTime = React.useCallback(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 1) // Минимум через 1 минуту
    // Преобразуем в локальное время для datetime-local
    const offset = now.getTimezoneOffset()
    const localTime = new Date(now.getTime() - offset * 60 * 1000)
    return localTime.toISOString().slice(0, 16)
  }, [])

  /**
   * Генерирует максимальное значение datetime-local (через 24 часа)
   */
  const getMaxDateTime = React.useCallback(() => {
    const max = new Date()
    max.setHours(max.getHours() + 24)
    // Преобразуем в локальное время для datetime-local
    const offset = max.getTimezoneOffset()
    const localTime = new Date(max.getTime() - offset * 60 * 1000)
    return localTime.toISOString().slice(0, 16)
  }, [])

  /**
   * Обработчик открытия диалога (устанавливает начальное значение времени)
   */
  const handleOpenChange = React.useCallback((isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      // При открытии диалога устанавливаем время через 2 минуты
      const defaultTime = new Date()
      defaultTime.setMinutes(defaultTime.getMinutes() + 2)
      // Преобразуем в локальное время для datetime-local
      const offset = defaultTime.getTimezoneOffset()
      const localTime = new Date(defaultTime.getTime() - offset * 60 * 1000)
      setStartDateTime(localTime.toISOString().slice(0, 16))
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className={className}>+ Создать раунд</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Создание нового раунда</DialogTitle>
            <DialogDescription>
              Укажите время начала раунда. Раунд автоматически запустится в указанное время и продлится 60 секунд.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="startTime" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Время начала раунда
              </label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
                min={getMinDateTime()}
                max={getMaxDateTime()}
                required
                disabled={loading}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Раунд можно запланировать от 1 минуты до 24 часов вперед
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Создание...' : 'Создать раунд'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
})

CreateRoundButton.displayName = 'CreateRoundButton'
