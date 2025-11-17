import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Свойства компонента GooseImage
 */
export interface GooseImageProps {
  /** Флаг кликабельности гуся (активен только в статусе active) */
  clickable: boolean
  /** Обработчик клика по гусю */
  onTap?: () => void
  /** Дополнительные CSS классы */
  className?: string
}

/**
 * ASCII-арт изображение гуся для игры "The Last of Guss"
 *
 * Компонент отображает стилизованного гуся с двумя состояниями:
 * - Кликабельный (активный раунд) - с hover эффектами и анимацией
 * - Некликабельный (cooldown/completed) - серый и неактивный
 *
 * @param clickable - Флаг кликабельности
 * @param onTap - Callback при клике на гуся
 * @param className - Дополнительные CSS классы
 *
 * @example
 * // Активный раунд
 * <GooseImage clickable={true} onTap={handleTap} />
 *
 * @example
 * // Неактивный раунд
 * <GooseImage clickable={false} />
 */
export const GooseImage = React.memo<GooseImageProps>(({ clickable, onTap, className }) => {
  const handleClick = React.useCallback(() => {
    if (clickable && onTap) {
      onTap()
    }
  }, [clickable, onTap])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      // Поддержка клавиатуры: Space и Enter
      if (clickable && onTap && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        onTap()
      }
    },
    [clickable, onTap]
  )

  return (
    <div
      role={clickable ? 'button' : 'img'}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? 'Тапнуть по гусю' : 'Изображение гуся'}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'select-none transition-all duration-150',
        {
          // Стили для кликабельного гуся
          'cursor-pointer hover:scale-105 active:scale-95': clickable,
          // Стили для некликабельного гуся
          'cursor-not-allowed grayscale opacity-60': !clickable,
        },
        className
      )}
    >
      <pre
        className="font-mono text-xs leading-tight sm:text-sm md:text-base"
        aria-hidden="true"
      >
        {`              ░░░░░░░░░░░░░░░
            ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░
          ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░
          ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░
        ░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░
      ░░▒▒▒▒░░░░▓▓▓▓▓▓▓▓▓▓▓▓░░░░▒▒▒▒░░
      ░░▒▒▒▒▒▒▒▒░░░░░░░░░░░░▒▒▒▒▒▒▒▒░░
      ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░
        ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░
          ░░░░░░░░░░░░░░░░░░░░░░░░░░`}
      </pre>
    </div>
  )
})

GooseImage.displayName = 'GooseImage'
