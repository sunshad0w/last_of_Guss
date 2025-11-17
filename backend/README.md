# The Last of Guss - Backend

Backend API для игры "The Last of Guss" на NestJS + Prisma + PostgreSQL.

## Технологический стек

- **Framework**: NestJS 10.x
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT (bcrypt для паролей)
- **Validation**: class-validator + class-transformer

## Структура проекта

```
backend/
├── src/
│   ├── auth/                   # Модуль аутентификации
│   │   ├── dto/               # DTO для логина
│   │   ├── strategies/        # JWT стратегия
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── rounds/                # Модуль раундов
│   │   ├── dto/              # DTO для создания раунда
│   │   ├── rounds.controller.ts
│   │   ├── rounds.service.ts
│   │   └── rounds.module.ts
│   ├── taps/                 # Модуль тапов (критический!)
│   │   ├── guards/          # Rate limiting guard
│   │   ├── taps.controller.ts
│   │   ├── taps.service.ts  # Транзакционная логика
│   │   └── taps.module.ts
│   ├── prisma/              # Prisma сервис
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── common/              # Общие компоненты
│   │   ├── guards/         # JWT и Roles guards
│   │   ├── decorators/     # CurrentUser, Roles
│   │   └── filters/        # HTTP exception filter
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   └── schema.prisma        # Схема базы данных
├── .env.example
└── package.json
```

## Установка и запуск

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка окружения

Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

Отредактируйте `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/goose_game"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRATION="24h"
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
RATE_LIMIT_TAPS_PER_SECOND=10
RATE_LIMIT_GLOBAL_PER_MINUTE=100
ROUND_DURATION=60
COOLDOWN_DURATION=30
```

### 3. Настройка базы данных

```bash
# Генерация Prisma Client
npm run prisma:generate

# Создание миграций
npm run prisma:migrate

# (Опционально) Открыть Prisma Studio
npm run prisma:studio
```

### 4. Запуск сервера

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## Ключевые особенности

### 1. Транзакционная обработка тапов

**КРИТИЧЕСКИ ВАЖНО**: Модуль `taps` использует Prisma `$transaction` для атомарной обработки тапов.

```typescript
// taps/taps.service.ts
await this.prisma.$transaction(async (tx) => {
  // 1. Читаем текущий счетчик тапов
  const currentRound = await tx.round.findUnique(...);

  // 2. Определяем бонусный тап (каждый 11-й глобально)
  const isBonus = (currentRound.totalTaps + 1) % 11 === 0;

  // 3. Обновляем статистику игрока
  await tx.roundStats.upsert(...);

  // 4. Обновляем общую статистику раунда
  await tx.round.update(...);
});
```

Это гарантирует:
- Отсутствие race conditions при конкурентных запросах
- Правильный расчет бонусных тапов
- Консистентность данных

### 2. Rate Limiting

Защита от autoclicker'ов:
- Максимум 10 тапов в секунду на пользователя
- In-memory кеш с автоочисткой
- HTTP 429 при превышении лимита

**Production рекомендация**: Использовать Redis для масштабирования на несколько инстансов.

### 3. Роль "Никита"

Специальная роль для тестирования:
- Тапы регистрируются (taps++)
- Очки НЕ начисляются (points = 0)
- `totalPoints` раунда НЕ увеличивается
- Не участвует в определении победителя

### 4. Бонусные тапы

Каждый **11-й тап глобально** (по счетчику `Round.totalTaps`) получает **+10 очков** вместо +1.

### 5. Grace Period

Тапы, отправленные в течение **1 секунды** после `endTime`, засчитываются.

### 6. Определение победителя

Критерии:
1. Максимальное количество очков
2. При равенстве очков - минимальное количество тапов
3. При полном равенстве - первый по времени создания записи

## API Эндпоинты

### Authentication

- **POST /auth/login** - Вход/регистрация

### Rounds

- **GET /rounds** - Список раундов
- **POST /rounds** - Создать раунд (только admin)
- **GET /rounds/:id** - Детали раунда

### Taps

- **POST /rounds/:id/tap** - Тапнуть по гусю

Полная документация: `/docs/api.md`

## Разработка

### Генерация Prisma Client после изменений схемы

```bash
npm run prisma:generate
```

### Создание новой миграции

```bash
npx prisma migrate dev --name migration_name
```

### Форматирование кода

```bash
npm run format
```

### Линтинг

```bash
npm run lint
```

## Production Deployment

### 1. Настройка переменных окружения

```env
NODE_ENV="production"
DATABASE_URL="postgresql://..."
JWT_SECRET="<сгенерируйте крипто-стойкий ключ>"
```

### 2. Применение миграций

```bash
npm run prisma:deploy
```

### 3. Сборка и запуск

```bash
npm run build
npm run start:prod
```

### 4. Рекомендации

- Используйте Redis для rate limiting (масштабируемость)
- Настройте connection pooling в DATABASE_URL
- Используйте reverse proxy (nginx) для SSL
- Настройте monitoring и логирование

## Архитектура

### Stateless Design

Бекенд полностью stateless - вся логика хранится в PostgreSQL:
- Горизонтальное масштабирование
- Балансировка нагрузки
- Отказоустойчивость

### SOLID Principles

- **Single Responsibility**: Каждый сервис отвечает за свою область
- **Dependency Injection**: NestJS IoC контейнер
- **Interface Segregation**: Четкие DTO и интерфейсы

## Безопасность

- Пароли хешируются с помощью bcrypt (10 раундов)
- JWT токены с истечением срока действия
- Prisma ORM защищает от SQL-инъекций
- Rate limiting защищает от DoS
- Валидация всех входных данных (class-validator)

## Лицензия

MIT
