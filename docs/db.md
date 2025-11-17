# База данных - Goose Game

> **Краткая сводка схемы базы данных. Полная документация доступна в prd.md**

## 1. Стек технологий

- **СУБД:** PostgreSQL
- **ORM:** Prisma
- **Язык:** TypeScript (NestJS)

## 2. ER-диаграмма

```mermaid
erDiagram
    User ||--o{ RoundStats : "имеет статистику"
    Round ||--o{ RoundStats : "содержит статистику"

    User {
        uuid id PK
        string username UK
        string password_hash
        UserRole role
        datetime created_at
        datetime updated_at
    }

    Round {
        uuid id PK
        datetime start_time
        datetime end_time
        RoundStatus status
        int total_taps
        int total_points
        datetime created_at
        datetime updated_at
    }

    RoundStats {
        uuid id PK
        uuid round_id FK
        uuid user_id FK
        int taps
        int points
        datetime created_at
        datetime updated_at
    }
```

## 3. Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Перечисления (Enums)
enum UserRole {
  SURVIVOR  // Обычный игрок
  NIKITA    // Специальная роль (без санкций)
  ADMIN     // Администратор
}

enum RoundStatus {
  COOLDOWN  // Период ожидания между раундами
  ACTIVE    // Активный раунд (идет игра)
  COMPLETED // Завершенный раунд
}

// Модель пользователя
model User {
  id           String      @id @default(uuid())
  username     String      @unique
  passwordHash String      @map("password_hash")
  role         UserRole    @default(SURVIVOR)
  createdAt    DateTime    @default(now()) @map("created_at")
  updatedAt    DateTime    @updatedAt @map("updated_at")

  roundStats   RoundStats[]

  @@map("users")
}

// Модель раунда
model Round {
  id          String      @id @default(uuid())
  startTime   DateTime    @map("start_time")
  endTime     DateTime    @map("end_time")
  status      RoundStatus @default(COOLDOWN)
  totalTaps   Int         @default(0) @map("total_taps")
  totalPoints Int         @default(0) @map("total_points")
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  roundStats  RoundStats[]

  @@index([status])
  @@index([startTime])
  @@map("rounds")
}

// Модель статистики игрока в раунде
model RoundStats {
  id        String   @id @default(uuid())
  roundId   String   @map("round_id")
  userId    String   @map("user_id")
  taps      Int      @default(0)
  points    Int      @default(0)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  round     Round    @relation(fields: [roundId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([roundId, userId])
  @@index([roundId])
  @@index([userId])
  @@index([points])
  @@map("round_stats")
}
```

## 4. Индексы и их назначение

### 4.1 Уникальные индексы

| Таблица | Поле | Назначение |
|---------|------|-----------|
| `users` | `username` | Быстрый поиск пользователя по имени, предотвращение дубликатов |
| `round_stats` | `(roundId, userId)` | Гарантия уникальности: один игрок = одна запись на раунд |

### 4.2 Индексы для производительности

| Таблица | Поле | Назначение |
|---------|------|-----------|
| `rounds` | `status` | Фильтрация раундов по статусу (ACTIVE, COMPLETED, COOLDOWN) |
| `rounds` | `startTime` | Сортировка раундов по времени начала |
| `round_stats` | `roundId` | Ускорение JOIN с таблицей rounds |
| `round_stats` | `userId` | Ускорение JOIN с таблицей users |
| `round_stats` | `points` | Быстрая сортировка для определения победителя |

## 5. Ограничения и связи

### 5.1 Уникальные ограничения (UNIQUE)
- `users.username` - имя пользователя должно быть уникальным
- `round_stats.(roundId, userId)` - игрок может иметь только одну запись статистики на раунд

### 5.2 Внешние ключи (Foreign Keys)
```sql
-- RoundStats -> Round
round_stats.round_id -> rounds.id (ON DELETE CASCADE)

-- RoundStats -> User
round_stats.user_id -> users.id (ON DELETE CASCADE)
```

**ON DELETE CASCADE** - при удалении раунда/пользователя автоматически удаляются связанные записи статистики.

## 6. Миграции

### 6.1 Первоначальная настройка

```bash
# 1. Создать начальную миграцию
npx prisma migrate dev --name init

# 2. Сгенерировать Prisma Client
npx prisma generate
```

### 6.2 Production deployment

```bash
# Применить миграции в продакшене (без интерактивных промптов)
npx prisma migrate deploy
```

### 6.3 Разработка

```bash
# Создать новую миграцию после изменений в schema.prisma
npx prisma migrate dev --name <migration_name>

# Просмотр статуса миграций
npx prisma migrate status

# Откат последней миграции (только для разработки!)
npx prisma migrate reset
```

### 6.4 Полезные команды

```bash
# Открыть Prisma Studio для просмотра данных
npx prisma studio

# Форматирование schema.prisma
npx prisma format

# Валидация схемы
npx prisma validate
```

## 7. Подключение к БД

### 7.1 Переменные окружения

```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/goose_game"
```

### 7.2 Connection Pooling

Prisma по умолчанию использует **connection pool** с 10 соединениями. Для настройки:

```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/goose_game?connection_limit=10"
```

## 8. Типичные запросы

### 8.1 Создание пользователя

```typescript
const user = await prisma.user.create({
  data: {
    username: 'Иван',
    passwordHash: hashedPassword,
    role: 'SURVIVOR',
  },
});
```

### 8.2 Получение активного раунда

```typescript
const activeRound = await prisma.round.findFirst({
  where: { status: 'ACTIVE' },
  include: {
    roundStats: {
      include: { user: true },
      orderBy: { points: 'desc' },
    },
  },
});
```

### 8.3 Upsert статистики игрока

```typescript
const stats = await prisma.roundStats.upsert({
  where: {
    roundId_userId: {
      roundId: round.id,
      userId: user.id,
    },
  },
  update: {
    taps: { increment: 1 },
    points: { increment: points },
  },
  create: {
    roundId: round.id,
    userId: user.id,
    taps: 1,
    points: points,
  },
});
```

### 8.4 Транзакция для обновления тапа

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Обновить статистику игрока
  await tx.roundStats.upsert({...});

  // 2. Обновить общую статистику раунда
  await tx.round.update({
    where: { id: roundId },
    data: {
      totalTaps: { increment: 1 },
      totalPoints: { increment: points },
    },
  });
});
```

## 9. Безопасность

### 9.1 Защита от SQL-инъекций
Prisma **автоматически экранирует** все параметры запросов - SQL-инъекции невозможны при правильном использовании ORM.

### 9.2 Хеширование паролей
```typescript
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;
const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
```

## 10. Примечания

- Все таймстампы хранятся в UTC
- UUID используется для всех первичных ключей
- Использование `snake_case` для имен колонок в БД (через `@map()`)
- Использование `camelCase` в TypeScript коде (Prisma автоматически конвертирует)

---

**Дополнительная информация:**
- Архитектура системы: см. раздел 5 в `prd.md`
- API спецификация: см. раздел 6 в `prd.md`
- Бизнес-логика: см. разделы 2-4 в `prd.md`
