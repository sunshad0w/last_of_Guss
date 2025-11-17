# UI Components - The Last of Guss

Набор React компонентов для игры "The Last of Guss", разработанных с использованием TypeScript strict mode, shadcn/ui паттернов и Tailwind CSS.

## Структура компонентов

```
components/
├── ui/                      # shadcn/ui базовые компоненты
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   └── dialog.tsx
├── GooseImage.tsx           # Кликабельный ASCII-арт гусь
├── Countdown.tsx            # Таймер обратного отсчета
├── RoundCard.tsx            # Карточка раунда
├── CreateRoundButton.tsx    # Кнопка создания раунда (admin)
└── index.ts                 # Barrel export
```

## Быстрый старт

### Базовые компоненты

```tsx
import { Button, Input, Card, CardContent, Badge } from '@/components/ui'

// Кнопка
<Button variant="default" size="lg">Войти</Button>

// Поле ввода
<Input type="text" placeholder="Имя пользователя" />

// Карточка
<Card>
  <CardContent>Контент</CardContent>
</Card>

// Badge
<Badge variant="success">Активен</Badge>
```

### Кастомные компоненты

```tsx
import { GooseImage, Countdown, RoundCard, CreateRoundButton } from '@/components'

// Гусь (активный раунд)
<GooseImage clickable={true} onTap={handleTap} />

// Таймер
<Countdown timeLeft={120} label="До начала раунда:" />

// Карточка раунда
<RoundCard round={roundData} />

// Кнопка создания раунда (только для админов)
<CreateRoundButton onCreated={fetchRounds} />
```

## Компоненты

### GooseImage

ASCII-арт изображение гуся с двумя состояниями.

**Props:**
- `clickable: boolean` - Кликабельность гуся
- `onTap?: () => void` - Обработчик клика
- `className?: string` - CSS классы

**Особенности:**
- Hover/Active анимации для кликабельного состояния
- Grayscale фильтр для некликабельного
- Keyboard support (Space, Enter)
- ARIA атрибуты

---

### Countdown

Таймер обратного отсчета в формате MM:SS.

**Props:**
- `timeLeft: number` - Секунды
- `label?: string` - Метка над таймером
- `className?: string` - CSS классы

**Особенности:**
- Автоматическое обновление каждую секунду
- ARIA live region
- Tabular nums для стабильного layout

---

### RoundCard

Карточка раунда для списка.

**Props:**
- `round: Round` - Данные раунда
- `className?: string` - CSS классы

**Отображает:**
- ID раунда (8 символов)
- Время начала/окончания
- Статус с Badge
- Countdown для cooldown раундов
- Победитель для completed раундов

**Статусы:**
- 🟢 Active → success badge
- 🟡 Cooldown → warning badge + countdown
- ⚫ Completed → muted badge

---

### CreateRoundButton

Кнопка создания раунда (только для админов).

**Props:**
- `onCreated?: () => void` - Callback после создания
- `className?: string` - CSS классы

**Особенности:**
- Автоматически скрывается для не-админов
- Dialog с datetime picker
- Валидация времени (1 мин - 24 часа)
- Toast уведомления
- Автоматическая навигация

---

## Типы

```typescript
// Round
interface Round {
  id: string
  startTime: string
  endTime: string
  status: 'cooldown' | 'active' | 'completed'
  totalTaps: number
  totalPoints: number
  myStats?: RoundStats | null
  winner?: Winner | null
}

// User
interface User {
  id: string
  username: string
  role: 'survivor' | 'nikita' | 'admin'
}
```

## Стилизация

### Цветовая палитра

```javascript
// tailwind.config.js
colors: {
  success: '#4CAF50',   // Зеленый (Active)
  warning: '#FFC107',   // Желтый (Cooldown)
}
```

### Badge варианты
- `success` - Зеленый (#4CAF50)
- `warning` - Желтый (#FFC107)
- `muted` - Серый
- `default` - Синий
- `destructive` - Красный

## Accessibility

Все компоненты поддерживают:
- ✅ Keyboard navigation (Tab, Enter, Space)
- ✅ ARIA атрибуты
- ✅ Focus management
- ✅ Screen reader support

## Performance

Все компоненты оптимизированы с использованием:
- `React.memo()` - Предотвращение re-renders
- `useCallback()` - Стабильные обработчики
- `useMemo()` - Кэшированные вычисления

## Пример интеграции

### Страница раунда (Active)

```tsx
import { GooseImage, Countdown } from '@/components'
import { Card, CardContent } from '@/components/ui/card'
import { useRound, useCountdown, useTap } from '@/hooks'

export const RoundPage = () => {
  const { round } = useRound(id)
  const { timeLeft } = useCountdown(round.endTime)
  const { tap, localPoints } = useTap(id)

  return (
    <div className="container mx-auto p-6">
      <GooseImage clickable={true} onTap={tap} />

      <Card className="bg-success/10">
        <CardContent>
          <Countdown timeLeft={timeLeft} label="До конца:" />
          <p className="text-2xl font-bold">Очки: {localPoints}</p>
        </CardContent>
      </Card>
    </div>
  )
}
```

## Документация

Полная документация доступна в:
- `/temp/mds/UI_COMPONENTS_2025-11-17_12-30.md` - Техническая документация
- `/temp/mds/COMPONENTS_USAGE_GUIDE_2025-11-17_12-35.md` - Руководство разработчика
- `/temp/mds/COMPONENTS_STRUCTURE.txt` - Визуальная схема

## Лицензия

MIT
