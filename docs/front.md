# Frontend архитектура - The Last of Guss

**Краткая сводка фронтенд архитектуры. Полная документация доступна в prd.md**

**Версия:** 1.0
**Дата создания:** 2025-11-17

---

## Технологический стек

```
React 18+ + TypeScript (strict mode)
Vite (build tool)
React Router v6 (routing)
shadcn/ui + Radix UI + Tailwind CSS (UI components)
sonner (toast notifications)
Axios (HTTP client)
```

---

## 1. Структура проекта

```
src/
├── main.tsx                    # Entry point, Toaster setup
├── App.tsx                     # Root component with Router
├── pages/
│   ├── LoginPage.tsx           # /login
│   ├── RoundsListPage.tsx      # /rounds (список раундов)
│   └── RoundPage.tsx           # /rounds/:id (детали раунда + тапы)
├── components/
│   ├── ui/                     # shadcn/ui компоненты (button, input, card, form, toast)
│   ├── GooseImage.tsx          # Кликабельное изображение гуся
│   ├── RoundCard.tsx           # Карточка раунда в списке
│   ├── Countdown.tsx           # Обратный отсчет времени
│   ├── Leaderboard.tsx         # Финальные результаты раунда
│   └── CreateRoundButton.tsx   # Кнопка создания раунда (admin only)
├── hooks/
│   ├── useAuth.ts              # Authentication logic
│   ├── useRound.ts             # Загрузка данных раунда
│   ├── useTap.ts               # Обработка тапов
│   └── useCountdown.ts         # Client-side таймер с автообновлением
├── services/
│   ├── api.ts                  # Axios instance + JWT interceptor
│   ├── auth.service.ts         # POST /auth/login
│   ├── rounds.service.ts       # GET/POST /rounds, GET /rounds/:id
│   └── taps.service.ts         # POST /rounds/:id/tap
├── context/
│   └── AuthContext.tsx         # Глобальный state: user, token, login(), logout()
├── types/
│   ├── user.types.ts           # User, Role
│   ├── round.types.ts          # Round, RoundStatus
│   └── stats.types.ts          # RoundStats, Winner
└── utils/
    ├── jwt.utils.ts            # decodeToken()
    ├── time.utils.ts           # formatCountdown(), getTimeLeft()
    └── toast.utils.ts          # showError(), showSuccess() wrappers
```

---

## 2. Компонентная иерархия

```
App.tsx
├── AuthProvider (context)
│   └── Router
│       ├── LoginPage
│       │   ├── Card (ui)
│       │   ├── Input (ui)
│       │   └── Button (ui)
│       │
│       ├── RoundsListPage (protected)
│       │   ├── CreateRoundButton (admin only)
│       │   └── RoundCard[] (grouped by status)
│       │       ├── Card (ui)
│       │       └── Badge (status indicator)
│       │
│       └── RoundPage (protected)
│           ├── Countdown (useCountdown)
│           ├── GooseImage (useTap)
│           │   └── img (tappable)
│           └── Leaderboard (if completed)
│               └── Card (ui)
│
└── Toaster (sonner) - глобальные toast уведомления
```

---

## 3. State Management

### 3.1 React Context API

**AuthContext** - глобальный state аутентификации:

```tsx
interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

// Provider в App.tsx
<AuthProvider>
  <RouterProvider router={router} />
</AuthProvider>

// Использование в компонентах
const { user, isAuthenticated, logout } = useAuth()
```

**Особенности:**
- Token сохраняется в `localStorage`
- При монтировании проверяется наличие токена
- Автоматический logout при 401 ошибках (через axios interceptor)

### 3.2 Local Component State

Каждый компонент управляет своим локальным state через `useState`:

- **RoundPage**: loading, error, roundData
- **GooseImage**: isAnimating (для визуальной обратной связи при тапе)
- **LoginPage**: username, password, error

---

## 4. Роутинг (React Router v6)

### 4.1 Структура маршрутов

```tsx
const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/',
    element: <ProtectedRoute />, // проверка isAuthenticated
    children: [
      {
        index: true,
        element: <Navigate to="/rounds" replace />
      },
      {
        path: 'rounds',
        element: <RoundsListPage />
      },
      {
        path: 'rounds/:id',
        element: <RoundPage />
      }
    ]
  }
])
```

### 4.2 Protected Routes

```tsx
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
```

### 4.3 Навигация

```tsx
// После успешного логина
navigate('/rounds')

// Клик по раунду
navigate(`/rounds/${round.id}`)

// Создание раунда (admin)
const newRound = await createRound(startTime)
navigate(`/rounds/${newRound.id}`)
```

---

## 5. Интеграция с API

### 5.1 Axios Setup

**src/services/api.ts:**

```tsx
import axios from 'axios'
import { toast } from 'sonner'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor: автоматическая подстановка JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: обработка ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Автоматический logout
      localStorage.removeItem('token')
      window.location.href = '/login'
      toast.error('Сессия истекла. Войдите снова')
    } else if (error.response?.status === 403) {
      toast.error('Недостаточно прав')
    } else if (error.response?.status === 429) {
      toast.error('Слишком много запросов. Подождите')
    } else {
      toast.error(error.response?.data?.message || 'Ошибка сервера')
    }
    return Promise.reject(error)
  }
)

export default api
```

### 5.2 API Service Layer

**auth.service.ts:**

```tsx
import api from './api'
import type { LoginResponse } from '@/types/user.types'

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', {
      username,
      password
    })
    return response.data
  }
}
```

**rounds.service.ts:**

```tsx
import api from './api'
import type { Round, CreateRoundDto } from '@/types/round.types'

export const roundsService = {
  async getRounds(): Promise<Round[]> {
    const response = await api.get<{ rounds: Round[] }>('/rounds')
    return response.data.rounds
  },

  async getRoundById(id: string): Promise<Round> {
    const response = await api.get<Round>(`/rounds/${id}`)
    return response.data
  },

  async createRound(dto: CreateRoundDto): Promise<Round> {
    const response = await api.post<Round>('/rounds', dto)
    return response.data
  }
}
```

**taps.service.ts:**

```tsx
import api from './api'
import type { TapResponse } from '@/types/stats.types'

export const tapsService = {
  async tap(roundId: string): Promise<TapResponse> {
    const response = await api.post<TapResponse>(`/rounds/${roundId}/tap`)
    return response.data
  }
}
```

### 5.3 Error Handling

Все ошибки обрабатываются централизованно через axios interceptor. В компонентах достаточно:

```tsx
try {
  await authService.login(username, password)
  toast.success('Вход выполнен успешно')
} catch {
  // Ошибка уже показана через interceptor
  // Можно добавить локальную логику (например, shake анимацию)
}
```

---

## 6. Custom Hooks

### 6.1 useAuth

**Назначение:** Доступ к контексту аутентификации

```tsx
import { useContext } from 'react'
import { AuthContext } from '@/context/AuthContext'

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

**Использование:**

```tsx
const { user, isAuthenticated, login, logout } = useAuth()

// Проверка роли
const isAdmin = user?.role === 'admin'
```

### 6.2 useRound

**Назначение:** Загрузка данных раунда с автообновлением

```tsx
import { useState, useEffect } from 'react'
import { roundsService } from '@/services/rounds.service'
import type { Round } from '@/types/round.types'

interface UseRoundReturn {
  round: Round | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useRound = (roundId: string): UseRoundReturn => {
  const [round, setRound] = useState<Round | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRound = async () => {
    try {
      setLoading(true)
      const data = await roundsService.getRoundById(roundId)
      setRound(data)
      setError(null)
    } catch (err) {
      setError('Не удалось загрузить раунд')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRound()

    // Автообновление каждые 2 секунды для активных раундов
    const interval = setInterval(fetchRound, 2000)
    return () => clearInterval(interval)
  }, [roundId])

  return { round, loading, error, refetch: fetchRound }
}
```

**Использование:**

```tsx
const { round, loading } = useRound(roundId)

if (loading) return <div>Загрузка...</div>
return <div>{round.status}</div>
```

### 6.3 useTap

**Назначение:** Обработка тапов с оптимистичным обновлением

```tsx
import { useState, useCallback } from 'react'
import { tapsService } from '@/services/taps.service'
import { toast } from 'sonner'

interface UseTapReturn {
  tap: () => Promise<void>
  isTapping: boolean
  localTaps: number
  localPoints: number
}

export const useTap = (
  roundId: string,
  initialTaps: number = 0,
  initialPoints: number = 0
): UseTapReturn => {
  const [isTapping, setIsTapping] = useState(false)
  const [localTaps, setLocalTaps] = useState(initialTaps)
  const [localPoints, setLocalPoints] = useState(initialPoints)

  const tap = useCallback(async () => {
    if (isTapping) return // Защита от двойного клика

    setIsTapping(true)

    // Оптимистичное обновление UI
    setLocalTaps(prev => prev + 1)

    try {
      const response = await tapsService.tap(roundId)
      // Синхронизация с сервером
      setLocalTaps(response.taps)
      setLocalPoints(response.points)

      // Показываем бонус при 11-м тапе
      if (response.earnedPoints === 10) {
        toast.success('🎉 Бонус! +10 очков!')
      }
    } catch {
      // Откат оптимистичного обновления
      setLocalTaps(prev => prev - 1)
    } finally {
      setIsTapping(false)
    }
  }, [roundId, isTapping])

  return { tap, isTapping, localTaps, localPoints }
}
```

**Использование:**

```tsx
const { tap, localTaps, localPoints } = useTap(roundId, round.myStats?.taps, round.myStats?.points)

<GooseImage onClick={tap} />
<div>Тапы: {localTaps} | Очки: {localPoints}</div>
```

### 6.4 useCountdown

**Назначение:** Client-side таймер с автоматическим обновлением UI

```tsx
import { useState, useEffect } from 'react'
import { getTimeLeft } from '@/utils/time.utils'

interface UseCountdownReturn {
  timeLeft: number // секунды
  isExpired: boolean
}

export const useCountdown = (targetDate: Date): UseCountdownReturn => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(targetDate))

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate))
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  return {
    timeLeft,
    isExpired: timeLeft <= 0
  }
}
```

**Использование:**

```tsx
const { timeLeft, isExpired } = useCountdown(new Date(round.startTime))

if (!isExpired) {
  return <div>До начала: {formatCountdown(timeLeft)}</div>
}
```

---

## 7. Client-Side Timer Strategy

### 7.1 Проблема

- WebSocket не используется (согласно требованиям)
- Нужен real-time отсчет времени для cooldown и active состояний
- Серверное время - source of truth

### 7.2 Решение

**Hybrid Approach:**

1. **Client-side таймер** (`useCountdown`) для UI обновлений каждую секунду
2. **Polling** (`useRound`) каждые 2 секунды для синхронизации с сервером
3. **Server time as source of truth** - при каждом запросе корректируем локальный таймер

```tsx
// Компонент RoundPage
const { round } = useRound(roundId) // Polling каждые 2 секунды
const { timeLeft } = useCountdown(
  round.status === 'cooldown'
    ? new Date(round.startTime)
    : new Date(round.endTime)
)

// Автоматический переход между состояниями
useEffect(() => {
  if (round.status === 'cooldown' && timeLeft <= 0) {
    // Статус изменится при следующем polling
  }
  if (round.status === 'active' && timeLeft <= 0) {
    // Раунд завершился, показываем результаты
  }
}, [timeLeft, round.status])
```

### 7.3 Форматирование времени

```tsx
// utils/time.utils.ts
export const getTimeLeft = (targetDate: Date): number => {
  const now = new Date().getTime()
  const target = new Date(targetDate).getTime()
  return Math.max(0, Math.floor((target - now) / 1000))
}

export const formatCountdown = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
```

---

## 8. Toast Notifications (sonner)

### 8.1 Setup

**main.tsx:**

```tsx
import { Toaster } from 'sonner'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      richColors
      expand={false}
      closeButton
    />
  </React.StrictMode>
)
```

### 8.2 Использование

```tsx
import { toast } from 'sonner'

// Success
toast.success('Раунд создан успешно')

// Error
toast.error('Не удалось выполнить запрос')

// Info
toast.info('Раунд начнется через 30 секунд')

// Warning
toast.warning('До конца раунда осталось 10 секунд!')

// С кастомным содержимым
toast.success('🎉 Бонус! +10 очков!', {
  duration: 3000
})
```

### 8.3 Интеграция с Axios

Все API ошибки автоматически показываются через interceptor (см. раздел 5.1).

---

## 9. TypeScript Types

### 9.1 user.types.ts

```tsx
export type Role = 'survivor' | 'nikita' | 'admin'

export interface User {
  id: string
  username: string
  role: Role
}

export interface LoginResponse {
  accessToken: string
  user: User
}
```

### 9.2 round.types.ts

```tsx
export type RoundStatus = 'cooldown' | 'active' | 'completed'

export interface Round {
  id: string
  startTime: string // ISO 8601
  endTime: string
  status: RoundStatus
  totalTaps: number
  totalPoints: number
  myStats?: RoundStats | null
  winner?: Winner | null
}

export interface CreateRoundDto {
  startTime: string // ISO 8601
}
```

### 9.3 stats.types.ts

```tsx
export interface RoundStats {
  taps: number
  points: number
}

export interface Winner {
  username: string
  points: number
}

export interface TapResponse {
  taps: number
  points: number
  earnedPoints: number // 1 или 10
}
```

---

## 10. Практические примеры

### 10.1 LoginPage

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await login(username, password)
      toast.success('Добро пожаловать!')
      navigate('/rounds')
    } catch {
      // Ошибка уже показана через interceptor
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">The Last of Guss</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Имя пользователя"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Пароль (мин. 8 символов)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <Button type="submit" className="w-full">
              Войти
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 10.2 RoundsListPage

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { roundsService } from '@/services/rounds.service'
import { RoundCard } from '@/components/RoundCard'
import { CreateRoundButton } from '@/components/CreateRoundButton'
import { Button } from '@/components/ui/button'
import type { Round } from '@/types/round.types'

export const RoundsListPage: React.FC = () => {
  const [rounds, setRounds] = useState<Round[]>([])
  const [loading, setLoading] = useState(true)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const fetchRounds = async () => {
    try {
      const data = await roundsService.getRounds()
      setRounds(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRounds()
    const interval = setInterval(fetchRounds, 5000) // Обновление каждые 5 секунд
    return () => clearInterval(interval)
  }, [])

  const activeRounds = rounds.filter(r => r.status === 'active')
  const cooldownRounds = rounds.filter(r => r.status === 'cooldown')
  const completedRounds = rounds.filter(r => r.status === 'completed')

  if (loading) return <div>Загрузка...</div>

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Раунды</h1>
        <div className="flex gap-2">
          <span>Привет, {user?.username}!</span>
          <Button variant="outline" onClick={logout}>Выйти</Button>
        </div>
      </div>

      {user?.role === 'admin' && <CreateRoundButton onCreated={fetchRounds} />}

      {activeRounds.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Активные</h2>
          <div className="grid gap-4">
            {activeRounds.map(round => (
              <RoundCard key={round.id} round={round} onClick={() => navigate(`/rounds/${round.id}`)} />
            ))}
          </div>
        </section>
      )}

      {cooldownRounds.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Запланированные</h2>
          <div className="grid gap-4">
            {cooldownRounds.map(round => (
              <RoundCard key={round.id} round={round} onClick={() => navigate(`/rounds/${round.id}`)} />
            ))}
          </div>
        </section>
      )}

      {completedRounds.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-3">Завершенные</h2>
          <div className="grid gap-4">
            {completedRounds.map(round => (
              <RoundCard key={round.id} round={round} onClick={() => navigate(`/rounds/${round.id}`)} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
```

### 10.3 RoundPage (упрощенный)

```tsx
import { useParams } from 'react-router-dom'
import { useRound } from '@/hooks/useRound'
import { useTap } from '@/hooks/useTap'
import { useCountdown } from '@/hooks/useCountdown'
import { GooseImage } from '@/components/GooseImage'
import { Countdown } from '@/components/Countdown'
import { Leaderboard } from '@/components/Leaderboard'
import { formatCountdown } from '@/utils/time.utils'

export const RoundPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { round, loading } = useRound(id!)

  if (loading || !round) return <div>Загрузка...</div>

  const { tap, localTaps, localPoints } = useTap(
    round.id,
    round.myStats?.taps,
    round.myStats?.points
  )

  const targetDate = round.status === 'cooldown'
    ? new Date(round.startTime)
    : new Date(round.endTime)

  const { timeLeft, isExpired } = useCountdown(targetDate)

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Раунд {round.id.slice(0, 8)}</h1>

      {round.status === 'cooldown' && (
        <div>
          <p className="text-lg">До начала раунда:</p>
          <Countdown time={formatCountdown(timeLeft)} />
        </div>
      )}

      {round.status === 'active' && (
        <div>
          <Countdown time={formatCountdown(timeLeft)} label="До конца раунда:" />
          <div className="my-6">
            <p>Ваши тапы: {localTaps} | Очки: {localPoints}</p>
          </div>
          <GooseImage onClick={tap} />
        </div>
      )}

      {round.status === 'completed' && (
        <Leaderboard
          winner={round.winner!}
          myStats={round.myStats!}
          totalTaps={round.totalTaps}
          totalPoints={round.totalPoints}
        />
      )}
    </div>
  )
}
```

---

## 11. Environment Variables

**.env:**

```bash
VITE_API_URL=http://localhost:3000
```

**Использование:**

```tsx
const apiUrl = import.meta.env.VITE_API_URL
```

---

## 12. Оптимизация производительности

### 12.1 React.memo для списков

```tsx
export const RoundCard = React.memo<RoundCardProps>(({ round, onClick }) => {
  // ...
})
```

### 12.2 useCallback для обработчиков

```tsx
const handleCreateRound = useCallback(async (startTime: string) => {
  // ...
}, [])
```

### 12.3 Lazy loading страниц

```tsx
const RoundPage = lazy(() => import('@/pages/RoundPage'))

<Suspense fallback={<div>Загрузка...</div>}>
  <RoundPage />
</Suspense>
```

### 12.4 Минимизация polling интервалов

- **RoundsListPage**: 5 секунд (список не критичен)
- **RoundPage (active)**: 2 секунды (real-time опыт)
- **RoundPage (cooldown/completed)**: 5 секунд (низкий приоритет)

---

## 13. Checklist разработки

- [ ] Настроить Vite + React + TypeScript
- [ ] Установить shadcn/ui + sonner
- [ ] Настроить React Router v6
- [ ] Создать AuthContext + useAuth hook
- [ ] Реализовать API service layer (axios + interceptors)
- [ ] Создать LoginPage
- [ ] Создать RoundsListPage с polling
- [ ] Создать RoundPage с client-side таймером
- [ ] Реализовать useTap с оптимистичными обновлениями
- [ ] Добавить toast уведомления для всех событий
- [ ] Протестировать на 3+ одновременных раундах
- [ ] Оптимизировать bundle size (lazy loading)

---

## Дополнительные ресурсы

- **Полная документация:** [prd.md](./prd.md)
- **shadcn/ui:** https://ui.shadcn.com/
- **React Router:** https://reactrouter.com/
- **sonner:** https://sonner.emilkowal.ski/

**Контакт:** См. prd.md раздел 18
