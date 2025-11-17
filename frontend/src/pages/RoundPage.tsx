import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { useRound } from '@/hooks/useRound'
import { useTap } from '@/hooks/useTap'
import { useCountdown } from '@/hooks/useCountdown'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCountdown, formatDate } from '@/utils/time.utils'
import { showWarning } from '@/utils/toast.utils'
import { toast } from 'sonner'

/**
 * Компонент изображения гуся
 *
 * @param clickable - Можно ли кликать
 * @param onTap - Обработчик клика
 * @param isTapping - Флаг выполнения тапа
 */
const GooseImage = ({
  clickable,
  onTap,
  isTapping,
}: {
  clickable: boolean
  onTap?: () => void
  isTapping?: boolean
}) => {
  return (
    <div
      className={`
        w-64 h-64 mx-auto mb-8 bg-muted rounded-lg flex items-center justify-center text-6xl
        transition-all duration-100
        ${clickable ? 'cursor-pointer hover:scale-105 active:scale-95' : 'grayscale opacity-60 cursor-not-allowed'}
        ${isTapping ? 'scale-95' : ''}
      `}
      onClick={clickable && !isTapping ? onTap : undefined}
      role={clickable ? 'button' : undefined}
      aria-label={clickable ? 'Тапнуть гуся' : 'Гусь недоступен'}
    >
      🦆
    </div>
  )
}

/**
 * Компонент состояния Cooldown
 */
const CooldownState = ({ timeLeft }: { timeLeft: number }) => {
  return (
    <Card className="bg-yellow-500/10 border-yellow-500/20">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-yellow-700">⏳ COOLDOWN</h2>
        <p className="text-4xl font-bold mb-2">{formatCountdown(timeLeft)}</p>
        <p className="text-sm text-muted-foreground">До начала раунда</p>
        <p className="text-xs text-muted-foreground mt-4">
          Раунд начнется автоматически. Гусь станет кликабельным.
        </p>
      </CardContent>
    </Card>
  )
}

/**
 * Компонент активного состояния раунда
 */
const ActiveState = ({
  timeLeft,
  localTaps,
  localPoints,
  isNikita,
}: {
  timeLeft: number
  localTaps: number
  localPoints: number
  isNikita: boolean
}) => {
  // Предупреждение за 10 секунд до конца
  useEffect(() => {
    if (timeLeft === 10) {
      showWarning('До конца раунда осталось 10 секунд!')
    }
  }, [timeLeft])

  return (
    <Card className="bg-green-500/10 border-green-500/20">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-green-700">🟢 РАУНД АКТИВЕН!</h2>
        <p className="text-4xl font-bold mb-2">{formatCountdown(timeLeft)}</p>
        <p className="text-sm text-muted-foreground mb-6">До конца раунда</p>

        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground">Мои тапы:</p>
          <p className="text-2xl font-bold">{localTaps}</p>
        </div>

        <div className="border-t pt-4 mt-4">
          <p className="text-sm text-muted-foreground">Мои очки:</p>
          <p className="text-3xl font-bold text-green-600">
            {isNikita ? 0 : localPoints}
          </p>
          {isNikita && (
            <p className="text-xs text-muted-foreground mt-1">
              (Роль Никита: очки не начисляются)
            </p>
          )}
        </div>

        <div className="mt-6 text-xs text-muted-foreground">
          💡 Каждый 11-й тап дает +10 очков вместо +1
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Компонент завершенного раунда
 */
const CompletedState = ({
  round,
  isNikita,
}: {
  round: {
    totalTaps: number
    totalPoints: number
    winner?: { username: string; points: number } | null
    myStats?: { taps: number; points: number } | null
  }
  isNikita: boolean
}) => {
  return (
    <Card className="bg-gray-500/10 border-gray-500/20">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-6">⚫ РАУНД ЗАВЕРШЕН</h2>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Всего тапов в раунде:</p>
            <p className="text-xl font-semibold">{round.totalTaps}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Всего очков в раунде:</p>
            <p className="text-xl font-semibold">{round.totalPoints}</p>
          </div>

          {round.winner && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">🏆 Победитель:</p>
              <p className="text-2xl font-bold text-yellow-600">
                {round.winner.username}
              </p>
              <p className="text-lg">{round.winner.points} очков</p>
            </div>
          )}

          {round.myStats && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">Мои результаты:</p>
              <p className="text-lg">
                Тапов: <span className="font-semibold">{round.myStats.taps}</span>
                {' | '}
                Очков:{' '}
                <span className="font-semibold">
                  {isNikita ? 0 : round.myStats.points}
                </span>
              </p>
              {isNikita && (
                <p className="text-xs text-muted-foreground mt-1">
                  (Роль Никита: очки не начисляются)
                </p>
              )}
            </div>
          )}

          {!round.myStats && (
            <p className="text-sm text-muted-foreground pt-4 border-t">
              Вы не участвовали в этом раунде
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Страница раунда с тремя состояниями: Cooldown, Active, Completed
 *
 * Cooldown: показывает обратный отсчет до начала, гусь некликабелен
 * Active: показывает обратный отсчет до конца, гусь кликабелен, отображаются тапы/очки
 * Completed: показывает финальную статистику, победителя, гусь некликабелен
 */
export default function RoundPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { round, loading, error } = useRound(id!)

  // Определяем целевую дату для таймера
  const targetDate =
    round?.status === 'cooldown'
      ? new Date(round.startTime)
      : round?.status === 'active'
      ? new Date(round.endTime)
      : null

  const { timeLeft } = useCountdown(targetDate || new Date())

  // Хук для тапов (только для активного раунда)
  const { tap, isTapping, localTaps, localPoints } = useTap(
    id!,
    round?.myStats?.taps || 0,
    round?.myStats?.points || 0
  )

  // Проверка роли пользователя
  const isNikita = user?.role === 'NIKITA'

  // Запоминаем, что пользователь присоединился к раунду
  const hasJoinedRef = useRef(false)

  // Проверка доступа к активному раунду
  useEffect(() => {
    if (!loading && round) {
      // Если пользователь уже участвует (есть myStats) или раунд в cooldown - разрешаем доступ
      if (round.myStats || round.status === 'cooldown') {
        hasJoinedRef.current = true
      }

      // Блокируем доступ только если:
      // 1. Раунд активный
      // 2. У пользователя нет статистики (не тапал)
      // 3. Пользователь НЕ присоединился ранее (не был на странице в cooldown)
      if (round.status === 'active' && !round.myStats && !hasJoinedRef.current) {
        toast.error('Доступ закрыт! Раунд уже начался', {
          description: 'Присоединиться можно только к запланированным раундам до их начала',
        })
        navigate('/rounds')
      }
    }
  }, [loading, round, navigate])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Загрузка раунда...</div>
      </div>
    )
  }

  // Error state
  if (error || !round) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-destructive text-lg">
          {error || 'Раунд не найден'}
        </div>
        <Button variant="outline" onClick={() => navigate('/rounds')}>
          ← Вернуться к списку раундов
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/rounds')}>
            ← Раунды
          </Button>
          <span className="ml-auto text-sm text-muted-foreground">
            Имя: {user?.username}
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 text-center">
        {/* Гусь - кликабелен только в активном раунде */}
        <GooseImage
          clickable={round.status === 'active'}
          onTap={tap}
          isTapping={isTapping}
        />

        {/* Состояние: Cooldown */}
        {round.status === 'cooldown' && <CooldownState timeLeft={timeLeft} />}

        {/* Состояние: Active */}
        {round.status === 'active' && (
          <ActiveState
            timeLeft={timeLeft}
            localTaps={localTaps}
            localPoints={localPoints}
            isNikita={isNikita}
          />
        )}

        {/* Состояние: Completed */}
        {round.status === 'completed' && (
          <CompletedState round={round} isNikita={isNikita} />
        )}

        {/* Метаданные раунда */}
        <div className="mt-6 text-sm text-muted-foreground space-y-1">
          <p>Round ID: {round.id.slice(0, 8)}...</p>
          <p>Start: {formatDate(round.startTime)}</p>
          <p>End: {formatDate(round.endTime)}</p>
        </div>
      </main>
    </div>
  )
}
