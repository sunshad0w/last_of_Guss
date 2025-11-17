import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { roundsService } from '@/services/rounds.service'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CreateRoundButton } from '@/components/CreateRoundButton'
import { RoundCard } from '@/components/RoundCard'
import type { Round } from '@/types/round.types'

/**
 * Skeleton для загрузки
 */
const RoundCardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-muted rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
          <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
        </div>
        <div className="h-8 bg-muted rounded w-24 animate-pulse" />
      </div>
    </CardContent>
  </Card>
)

/**
 * Страница списка раундов
 *
 * Отображает активные, запланированные и завершенные раунды
 * Автообновление каждые 5 секунд
 */
export default function RoundsListPage() {
  const [rounds, setRounds] = useState<Round[]>([])
  const [loading, setLoading] = useState(true)

  const { user, logout } = useAuth()

  const fetchRounds = useCallback(async () => {
    try {
      const data = await roundsService.getRounds()
      setRounds(data)
    } catch (err) {
      console.error('Error fetching rounds:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRounds()

    // Автообновление каждые 5 секунд
    const interval = setInterval(fetchRounds, 5000)

    return () => clearInterval(interval)
  }, [fetchRounds])

  // Группировка раундов по статусу: Active → Cooldown → Completed
  const activeRounds = rounds.filter((r) => r.status === 'active')
  const cooldownRounds = rounds.filter((r) => r.status === 'cooldown')
  const completedRounds = rounds.filter((r) => r.status === 'completed')

  const isAdmin = user?.role === 'ADMIN'

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Список РАУНДОВ</h1>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">Имя: {user?.username}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {isAdmin && (
          <div className="mb-6">
            <CreateRoundButton onCreated={fetchRounds} />
          </div>
        )}

        {loading && (
          <div className="flex flex-col gap-4">
            <RoundCardSkeleton />
            <RoundCardSkeleton />
            <RoundCardSkeleton />
          </div>
        )}

        {!loading && rounds.length === 0 && (
          <Card className="text-center p-12">
            <p className="text-muted-foreground">Раунды еще не созданы</p>
            {isAdmin && (
              <p className="text-sm text-muted-foreground mt-2">
                Создайте первый раунд, чтобы начать игру
              </p>
            )}
          </Card>
        )}

        {!loading && activeRounds.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">🟢 Активные</h2>
            <div className="flex flex-col gap-4">
              {activeRounds.map((round) => (
                <RoundCard key={round.id} round={round} />
              ))}
            </div>
          </section>
        )}

        {!loading && cooldownRounds.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">🟡 Запланированные</h2>
            <div className="flex flex-col gap-4">
              {cooldownRounds.map((round) => (
                <RoundCard key={round.id} round={round} />
              ))}
            </div>
          </section>
        )}

        {!loading && completedRounds.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-3">⚫ Завершенные</h2>
            <div className="flex flex-col gap-4">
              {completedRounds.map((round) => (
                <RoundCard key={round.id} round={round} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
