import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useCountdown } from '@/hooks/useCountdown'
import { formatCountdown } from '@/utils/time.utils'
import type { Round } from '@/types/round.types'
import { toast } from 'sonner'

/**
 * Свойства компонента RoundCard
 */
export interface RoundCardProps {
  /** Данные раунда для отображения */
  round: Round
  /** Дополнительные CSS классы */
  className?: string
}

/**
 * Форматирует дату в читаемый формат
 *
 * @param dateString - ISO строка даты
 * @returns Отформатированная строка "ДД.ММ.ГГГГ, ЧЧ:ММ:СС"
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

/**
 * Компонент карточки раунда для списка раундов
 *
 * Отображает информацию о раунде:
 * - ID раунда (первые 8 символов)
 * - Время начала и окончания
 * - Статус с цветовой индикацией
 * - Информация о победителе (для завершенных раундов)
 * - Обратный отсчет (для раундов в cooldown)
 *
 * Карточка кликабельна и навигирует на страницу детального просмотра раунда.
 *
 * @param round - Данные раунда
 * @param className - Дополнительные CSS классы
 *
 * @example
 * <RoundCard round={roundData} />
 */
export const RoundCard = React.memo<RoundCardProps>(({ round, className }) => {
  const navigate = useNavigate()
  const { timeLeft } = useCountdown(round.status === 'cooldown' ? round.startTime : round.endTime)

  const handleClick = React.useCallback(() => {
    // Проверяем доступность раунда
    if (round.status === 'active' && !round.myStats) {
      toast.error('Доступ закрыт! Раунд уже начался', {
        description: 'Присоединиться можно только к запланированным раундам до их начала',
      })
      return
    }
    navigate(`/rounds/${round.id}`)
  }, [navigate, round.id, round.status, round.myStats])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleClick()
      }
    },
    [handleClick]
  )

  // Проверяем доступность раунда
  const isAccessible = React.useMemo(() => {
    if (round.status === 'active' && !round.myStats) {
      return false // Активный раунд, но пользователь не участвует
    }
    return true // Cooldown, Completed, или Active с участием
  }, [round.status, round.myStats])

  // Определение варианта badge и текста статуса
  const statusConfig = React.useMemo(() => {
    switch (round.status) {
      case 'active':
        return {
          variant: 'success' as const,
          icon: isAccessible ? '🟢' : '🔒',
          text: isAccessible ? 'Активен (участвую)' : 'Активен (закрыт)',
        }
      case 'cooldown':
        return {
          variant: 'warning' as const,
          icon: '🟡',
          text: `Cooldown (${formatCountdown(timeLeft)})`,
        }
      case 'completed':
        return {
          variant: 'muted' as const,
          icon: '⚫',
          text: 'Завершен',
        }
    }
  }, [round.status, timeLeft, isAccessible])

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'cursor-pointer transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        !isAccessible && 'opacity-60 cursor-not-allowed hover:shadow-md',
        className
      )}
    >
      <CardContent className="p-6">
        {/* ID раунда */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-semibold text-primary">
            {statusConfig.icon} Round ID: {round.id.slice(0, 8)}
          </span>
        </div>

        {/* Время начала и окончания */}
        <div className="space-y-1 text-sm text-muted-foreground mb-4">
          <p>📅 Start: {formatDate(round.startTime)}</p>
          <p>🏁 End: {formatDate(round.endTime)}</p>
        </div>

        {/* Статистика для завершенных раундов */}
        {round.status === 'completed' && (
          <div className="mt-3 pt-3 border-t border-gray-200 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Тапов в раунде:</span>
              <span className="font-semibold text-foreground">{round.totalTaps}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Очков в раунде:</span>
              <span className="font-semibold text-foreground">{round.totalPoints}</span>
            </div>
            {round.winner && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-muted-foreground">
                  🏆 Победитель:{' '}
                  <span className="font-semibold text-yellow-600">{round.winner.username}</span> -{' '}
                  <span className="font-semibold text-foreground">{round.winner.points} очков</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Информация о доступности для активных раундов */}
        {round.status === 'active' && !isAccessible && (
          <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
            <p className="text-muted-foreground flex items-center gap-2">
              🔒 <span>Присоединиться можно только до начала раунда</span>
            </p>
          </div>
        )}

        {/* Информация об участии для активных раундов */}
        {round.status === 'active' && isAccessible && round.myStats && (
          <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
            <p className="text-muted-foreground">
              Мои тапы: <span className="font-semibold text-foreground">{round.myStats.taps}</span> | Очки:{' '}
              <span className="font-semibold text-foreground">{round.myStats.points}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

RoundCard.displayName = 'RoundCard'
