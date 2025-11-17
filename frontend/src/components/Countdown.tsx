import * as React from 'react'
import { cn } from '@/lib/utils'
import { formatCountdown } from '@/utils/time.utils'

/**
 * Свойства компонента Countdown
 */
export interface CountdownProps {
  /** Оставшееся время в секундах */
  timeLeft: number
  /** Метка для отображения (например, "До начала раунда:") */
  label?: string
  /** Дополнительные CSS классы */
  className?: string
}

/**
 * Компонент обратного отсчета времени
 *
 * Отображает оставшееся время в формате MM:SS с опциональной меткой.
 * Используется для отображения времени до начала раунда или до его окончания.
 *
 * @param timeLeft - Оставшееся время в секундах
 * @param label - Метка для отображения над таймером
 * @param className - Дополнительные CSS классы
 *
 * @example
 * const { timeLeft } = useCountdown(round.startTime)
 * <Countdown timeLeft={timeLeft} label="До начала раунда:" />
 *
 * @example
 * // Без метки
 * <Countdown timeLeft={45} />
 */
export const Countdown = React.memo<CountdownProps>(({ timeLeft, label, className }) => {
  const formattedTime = React.useMemo(() => formatCountdown(timeLeft), [timeLeft])

  return (
    <div className={cn('text-center', className)}>
      {label && <p className="text-lg font-medium text-muted-foreground mb-2">{label}</p>}
      <div
        className="text-4xl font-bold tabular-nums"
        role="timer"
        aria-live="polite"
        aria-atomic="true"
        aria-label={`Осталось ${formattedTime}`}
      >
        {formattedTime}
      </div>
    </div>
  )
})

Countdown.displayName = 'Countdown'
