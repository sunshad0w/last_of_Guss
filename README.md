# The Last of Guss

> Многопользовательская браузерная игра в жанре кликер с раундовой системой

![Status](https://img.shields.io/badge/status-active-success)
![Backend](https://img.shields.io/badge/backend-NestJS-red)
![Frontend](https://img.shields.io/badge/frontend-React-blue)
![Database](https://img.shields.io/badge/database-PostgreSQL-blue)

## Описание проекта

**The Last of Guss** - это многопользовательская игра-кликер с уникальной раундовой механикой и системой ролей. Игроки соревнуются в каждом раунде, накапливая очки путем нажатий (тапов), а затем ожидают следующего раунда для продолжения борьбы за лидерство.

### Основные возможности

- Система аутентификации с JWT токенами
- Раундовая игровая механика с чередованием активной фазы и кулдауна
- Реальное время обновление статистики игроков
- Система ролей (обычный игрок, Никита, администратор)
- Таблица лидеров с отображением топ игроков
- Rate limiting для защиты от читерства
- Адаптивный интерфейс на всех устройствах

### Игровая механика

1. **Активная фаза** (60 секунд) - игроки активно тапают и зарабатывают очки
2. **Кулдаун** (30 секунд) - период отдыха, показывается статистика раунда
3. Каждый тап обычного игрока приносит 1 очко
4. **Бонусные тапы**: каждый 11-й тап **всех игроков вместе** приносит +10 очков вместо +1
   - Счетчик общий для всего раунда (не для каждого игрока отдельно)
   - Например: 11-й, 22-й, 33-й тапы раунда дают бонус
5. Роль "Никита" - тапы учитываются, но не приносят очков (специальная роль)
6. Администраторы могут создавать новые раунды

---

## Технологический стек

### Backend (NestJS)

| Технология | Версия | Назначение |
|-----------|--------|------------|
| **NestJS** | 10.3 | Node.js фреймворк для построения серверных приложений |
| **Prisma** | 5.8 | ORM для работы с PostgreSQL |
| **PostgreSQL** | 14+ | Реляционная база данных |
| **JWT** | 10.2 | Аутентификация и авторизация |
| **bcrypt** | 5.1 | Хеширование паролей |
| **class-validator** | 0.14 | Валидация входящих данных |
| **Passport** | 0.7 | Middleware для аутентификации |

### Frontend (React)

| Технология | Версия | Назначение |
|-----------|--------|------------|
| **React** | 18.3 | UI библиотека |
| **TypeScript** | 5.6 | Типизация JavaScript |
| **Vite** | 5.4 | Сборщик и dev-сервер |
| **React Router** | 6.26 | Маршрутизация |
| **Axios** | 1.7 | HTTP клиент |
| **Tailwind CSS** | 3.4 | CSS фреймворк |
| **Radix UI** | - | Готовые UI компоненты |
| **Lucide React** | 0.445 | Библиотека иконок |

---

## Быстрый старт

### в docker вариации с балансером
- скопировать [.env.example](frontend/.env.example) в [.env](frontend/.env)
- скопировать [.env.example](backend/.env.example) в [.env](backend/.env)
- запустить [start-docker.sh](start-docker.sh)
- запустить [start-frontend.sh](start-frontend.sh)


### Требования

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 14.0

### Автоматическая установка

```bash
# 1. Клонируйте репозиторий (если еще не сделано)
cd /Users/sunshad0w/Work/tests/goose

# 2. Запустите скрипт полной настройки
./setup-project.sh
```

Скрипт автоматически:
- Проверит системные требования
- Установит все зависимости
- Проверит наличие .env файлов
- Сгенерирует Prisma Client
- Применит миграции базы данных

### Ручная установка

Если предпочитаете настроить вручную:

```bash
# 1. Установка backend зависимостей
cd backend
npm install

# 2. Установка frontend зависимостей
cd ../frontend
npm install

# 3. Настройка базы данных (см. docs/integration.md)
# Создайте БД PostgreSQL и настройте .env файлы

# 4. Применение миграций
cd ../backend
npm run prisma:generate
npm run prisma:migrate
```

### Запуск приложения

**Вариант 1: Использование скриптов**

```bash
# Терминал 1: Backend
./start-backend.sh

# Терминал 2: Frontend
./start-frontend.sh
```

**Вариант 2: Ручной запуск**

```bash
# Терминал 1: Backend
cd backend
npm run start:dev

# Терминал 2: Frontend
cd frontend
npm run dev
```

После запуска:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

---

## Структура проекта

```
goose/
├── backend/                    # NestJS Backend приложение
│   ├── src/
│   │   ├── auth/              # Модуль аутентификации
│   │   │   ├── auth.controller.ts    # POST /auth/register, /auth/login
│   │   │   ├── auth.service.ts       # Бизнес-логика аутентификации
│   │   │   ├── dto/                  # Data Transfer Objects
│   │   │   └── strategies/           # JWT стратегия Passport
│   │   ├── rounds/            # Модуль управления раундами
│   │   │   ├── rounds.controller.ts  # GET /rounds/*, POST /rounds
│   │   │   ├── rounds.service.ts     # Логика раундов
│   │   │   ├── rounds.scheduler.ts   # Автоматическое переключение раундов
│   │   │   └── dto/
│   │   ├── taps/              # Модуль обработки тапов
│   │   │   ├── taps.controller.ts    # POST /taps
│   │   │   ├── taps.service.ts       # Логика обработки тапов
│   │   │   └── dto/
│   │   ├── users/             # Модуль пользователей
│   │   ├── prisma/            # Prisma сервис для работы с БД
│   │   ├── common/            # Общие декораторы и guards
│   │   │   ├── decorators/    # @CurrentUser, @Roles
│   │   │   └── guards/        # JwtAuthGuard, RolesGuard
│   │   ├── app.module.ts      # Корневой модуль приложения
│   │   └── main.ts            # Точка входа, настройка CORS
│   ├── prisma/
│   │   ├── schema.prisma      # Схема базы данных
│   │   └── migrations/        # История миграций
│   ├── .env                   # Переменные окружения (создается вами)
│   ├── .env.example           # Шаблон переменных окружения
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md              # Детальная документация backend
│
├── frontend/                   # React Frontend приложение
│   ├── src/
│   │   ├── components/        # React компоненты
│   │   │   ├── ui/           # Базовые UI компоненты (button, card, dialog)
│   │   │   ├── RoundCard.tsx  # Карточка текущего раунда
│   │   │   ├── Countdown.tsx  # Таймер обратного отсчета
│   │   │   ├── GooseImage.tsx # Анимированное изображение гуся
│   │   │   └── CreateRoundButton.tsx
│   │   ├── pages/             # Страницы приложения
│   │   │   ├── LoginPage.tsx  # Страница входа/регистрации
│   │   │   ├── GamePage.tsx   # Основная игровая страница
│   │   │   └── StatsPage.tsx  # Статистика раундов
│   │   ├── context/           # React Context
│   │   │   └── AuthContext.tsx # Контекст аутентификации
│   │   ├── services/          # API сервисы
│   │   │   ├── api.ts         # Axios instance с interceptors
│   │   │   ├── auth.service.ts    # API методы аутентификации
│   │   │   ├── rounds.service.ts  # API методы раундов
│   │   │   └── taps.service.ts    # API методы тапов
│   │   ├── types/             # TypeScript типы
│   │   │   ├── user.types.ts
│   │   │   ├── round.types.ts
│   │   │   └── stats.types.ts
│   │   ├── utils/             # Утилиты
│   │   │   ├── jwt.utils.ts   # Работа с JWT токенами
│   │   │   ├── time.utils.ts  # Форматирование времени
│   │   │   └── toast.utils.ts # Уведомления
│   │   ├── App.tsx            # Корневой компонент с роутингом
│   │   ├── main.tsx           # Точка входа React
│   │   └── index.css          # Глобальные стили (Tailwind)
│   ├── public/
│   │   └── goose.png          # Изображение гуся
│   ├── .env                   # Переменные окружения (создается вами)
│   ├── .env.example           # Шаблон переменных окружения
│   ├── package.json
│   ├── vite.config.ts         # Конфигурация Vite
│   ├── tailwind.config.js     # Конфигурация Tailwind CSS
│   └── README.md              # Детальная документация frontend
│
├── nginx/                      # Конфигурация балансировщика нагрузки
│   └── nginx.conf             # Round-robin балансировка для 3 backend инстансов
│
├── docs/                       # Документация проекта
│   └── integration.md         # Подробное руководство по интеграции
│
├── temp/                       # Временные файлы
│   └── mds/                   # Markdown документы с датами
│
├── start-backend.sh           # Скрипт запуска backend
├── start-frontend.sh          # Скрипт запуска frontend
├── setup-project.sh           # Скрипт полной настройки проекта
└── README.md                  # Этот файл
```

---

## API Endpoints

### Аутентификация (`/auth`)

- `POST /auth/register` - Регистрация нового пользователя
- `POST /auth/login` - Вход в систему (получение JWT токена)

### Раунды (`/rounds`)

- `GET /rounds/current` - Получить текущий активный раунд
- `GET /rounds/stats` - Статистика текущего раунда
- `GET /rounds/history` - История завершенных раундов
- `POST /rounds` - Создать новый раунд (только администратор)

### Тапы (`/taps`)

- `POST /taps` - Отправить тап в текущем раунде

### Health Checks (`/health`)

- `GET /health` - Базовая проверка работоспособности
- `GET /health/detailed` - Детальная проверка (БД + метрики памяти)
- `GET /health/liveness` - Kubernetes liveness probe
- `GET /health/readiness` - Kubernetes readiness probe

> Детальное описание API с примерами запросов/ответов: `/Users/sunshad0w/Work/tests/goose/backend/README.md`

---

## База данных

### Схема

**Users (Пользователи)**
```sql
- id: UUID (PK)
- username: String (UNIQUE)
- passwordHash: String
- role: SURVIVOR | NIKITA | ADMIN
- createdAt: DateTime
- updatedAt: DateTime
```

**Rounds (Раунды)**
```sql
- id: UUID (PK)
- startTime: DateTime
- endTime: DateTime
- status: COOLDOWN | ACTIVE | COMPLETED
- totalTaps: Int
- totalPoints: Int
- createdAt: DateTime
- updatedAt: DateTime
```

**RoundStats (Статистика игроков в раундах)**
```sql
- id: UUID (PK)
- roundId: UUID (FK -> Rounds)
- userId: UUID (FK -> Users)
- taps: Int
- points: Int
- createdAt: DateTime
- updatedAt: DateTime
```

### Миграции

```bash
# Генерация Prisma Client
cd backend
npm run prisma:generate

# Применение миграций
npm run prisma:migrate

# Открыть Prisma Studio (GUI для БД)
npm run prisma:studio
```

---

## Конфигурация

### Backend (.env)

```env
# База данных
DATABASE_URL="postgresql://user:password@localhost:5432/goose_game"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRATION="1h"

# Сервер
PORT=3000
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:5173"

# Rate Limiting
RATE_LIMIT_TAPS_PER_SECOND=10  # Макс. тапов в секунду на пользователя

# Раунды
ROUND_DURATION=60       # Длительность активной фазы раунда (сек)
COOLDOWN_DURATION=30    # Длительность cooldown перед стартом (сек)
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000
```

---

## Разработка

### Backend

```bash
cd backend

# Development режим с hot-reload
npm run start:dev

# Production build
npm run build
npm run start:prod

# Тесты
npm run test
npm run test:watch
npm run test:cov

# Линтинг и форматирование
npm run lint
npm run format
```

### Frontend

```bash
cd frontend

# Development сервер
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Линтинг
npm run lint
```

---

## Production Deployment

### Подготовка к деплою

1. **Обновите переменные окружения:**
   - Установите сложный `JWT_SECRET`
   - Укажите production URL базы данных
   - Установите `NODE_ENV=production`
   - Обновите `FRONTEND_URL` на production URL

2. **Соберите frontend:**
   ```bash
   cd frontend
   npm run build
   # Результат в директории dist/
   ```

3. **Соберите backend:**
   ```bash
   cd backend
   npm run build
   # Результат в директории dist/
   ```

4. **Примените миграции на production БД:**
   ```bash
   cd backend
   npm run prisma:deploy
   ```

### Рекомендации по хостингу

- **Backend**: Vercel, Railway, Render, Heroku
- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Database**: Supabase, Railway, Render PostgreSQL

---

## Безопасность

Реализованные меры безопасности:

- JWT токены для аутентификации
- Хеширование паролей с bcrypt (10 раундов)
- CORS защита с настройкой allowed origins
- Rate limiting на критичные endpoints
- Валидация входящих данных с class-validator
- SQL injection защита через Prisma ORM
- XSS защита через экранирование на frontend

---

## Архитектура и масштабирование

### Поддержка множественных инстансов

Приложение спроектировано для горизонтального масштабирования:

```
┌─────────────────┐
│   Frontend      │
│  (React/Vite)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ NGINX (port 80) │
│  Load Balancer  │
└────────┬────────┘
         │
    ┌────┴────────┬──────────┐
    ▼             ▼          ▼
backend1:3000  backend2:3000  backend3:3000
    └─────────────┴──────────┘
              │
              ▼
      PostgreSQL (один экземпляр)
```

**Конфигурация:** `/Users/sunshad0w/Work/tests/goose/nginx/nginx.conf`

**Метод балансировки:** Round-robin (циклическое распределение запросов)

**Параметры:**
- `max_fails=3` - максимум 3 неудачных попытки
- `fail_timeout=30s` - исключение сервера на 30 секунд после ошибок
- `keepalive 32` - поддержка постоянных соединений

### Health Check Endpoints

Система мониторинга здоровья приложения:

| Endpoint | Назначение | Ответ |
|----------|-----------|-------|
| `GET /health` | Базовая проверка работоспособности | `{ status: "ok" }` |
| `GET /health/detailed` | Детальная проверка (БД + память) | JSON с метриками |
| `GET /health/liveness` | Kubernetes liveness probe | Приложение живо |
| `GET /health/readiness` | Kubernetes readiness probe | Готовность к трафику |

**Использование в Nginx:**
```nginx
location /health {
    proxy_pass http://backend_servers/health;
    access_log off;
}
```

---

## Особенности реализации

### Rate Limiting (Ограничение частоты запросов)

**Файл:** `backend/src/taps/guards/rate-limit.guard.ts`

**Лимит:** 10 тапов в секунду на пользователя

**Механизм:**
- In-memory кэш для хранения счетчиков
- Временное окно: 1 секунда
- Автоматическая очистка устаревших записей
- HTTP статус: 429 (Too Many Requests)

**Настройка через .env:**
```env
RATE_LIMIT_TAPS_PER_SECOND=10
```

**Применяется к:** `POST /rounds/:id/tap`

⚠️ **Важно для production:** При использовании нескольких backend инстансов каждый имеет собственный счетчик. Рекомендуется миграция на Redis для глобального лимита.

### Правила присоединения к раундам

**Автоматическое присоединение:** Первый тап в раунде автоматически создает запись в статистике

**Временные ограничения:**
- `startTime ≤ currentTime < endTime` - раунд активен (можно тапать)
- `currentTime < startTime` - раунд в режиме Cooldown (просмотр, но нельзя тапать)
- `currentTime ≥ endTime + 1 сек` - раунд завершен (нельзя тапать)

**Grace Period:** 1 секунда после окончания раунда для обработки последних тапов

**Ограничение:** Нельзя присоединиться к завершенному или будущему раунду (только к активному)

### Система ролей

| Роль | Может тапать | Создавать раунды | Получать очки |
|------|--------------|------------------|---------------|
| **SURVIVOR** (default) | ✓ | ✗ | ✓ (+1 обычный, +10 на бонусный) |
| **NIKITA** | ✓ | ✗ | ✗ (всегда 0, даже на бонусные) |
| **ADMIN** | ✓ | ✓ | ✓ |

**Автоматическое определение роли при регистрации:**
- Username "admin" → роль ADMIN
- Username "Никита" → роль NIKITA
- Остальные → роль SURVIVOR

**Бонусная механика:**
- Каждый 11-й тап **всего раунда** (общий счетчик всех игроков) дает +10 очков
- Игрок, который сделал этот тап, получает бонус
- Роль NIKITA не получает очки даже за бонусные тапы

**Файл логики:** `backend/src/auth/auth.service.ts`

### Транзакции и Race Conditions

**Файл:** `backend/src/taps/taps.service.ts`

Используется `prisma.$transaction()` для атомарной обработки тапов:

1. **Чтение глобального счетчика** - получение текущего `round.totalTaps` ДО обновления
2. **Расчет бонуса** - определение, является ли новый тап (totalTaps + 1) бонусным
3. **Проверка роли** - для роли NIKITA начисляется 0 очков
4. **Upsert статистики** - создание/обновление записи игрока в раунде
5. **Обновление раунда** - инкремент totalTaps и totalPoints

**Критическая особенность:** Бонусные очки (+10) начисляются на основе **глобального счетчика** всех тапов раунда:

```typescript
// Читаем текущее значение
const currentRound = await tx.round.findUnique({
  where: { id: roundId },
  select: { totalTaps: true },
});

// Рассчитываем новый номер тапа
const newTotalTaps = currentRound.totalTaps + 1;

// Проверяем на бонус (каждый 11-й)
const isBonus = newTotalTaps % 11 === 0;
```

Это предотвращает:
- Дублирование тапов при конкурентных запросах
- Неправильный подсчет бонусных очков (два игрока не могут получить один и тот же бонус)
- Рассинхронизацию между статистикой игрока и раунда
- Race conditions при определении бонусного тапа

### Guards и порядок выполнения

**Важно:** Порядок guards имеет значение!

```typescript
// Правильный порядок для POST /rounds/:id/tap
@UseGuards(JwtAuthGuard, RateLimitGuard)
// 1. Сначала проверяем авторизацию
// 2. Затем проверяем лимит запросов

// Для POST /rounds (создание раунда)
@UseGuards(JwtAuthGuard, RolesGuard)
// 1. Проверка авторизации
// 2. Проверка роли (только ADMIN)
```

**Глобальная валидация:** Настроена в `backend/src/main.ts` через `class-validator`

### JWT Аутентификация

**Конфигурация:**
- Secret: `JWT_SECRET` из .env
- TTL: 1 час (стандартный)
- Хранилище: localStorage (не cookies)
- Передача: `Authorization: Bearer <token>`

**Frontend interceptor:** `frontend/src/services/api.ts`
- Автоматическое добавление токена к запросам
- Auto-logout при 401 ошибке
- Переадресация на /login при отсутствии токена

### CORS настройки

**Файл:** `backend/src/main.ts`

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
});
```

⚠️ **Важно для Docker/Production:** Необходимо переопределить `FRONTEND_URL` в production окружении

---

## Production Checklist

Перед деплоем на production рекомендуется выполнить следующие улучшения:

### Критические

- [ ] **Миграция Rate Limiting на Redis** - текущая реализация использует in-memory кэш, который не работает корректно с несколькими backend инстансами
- [ ] **SSL/TLS для Nginx** - добавить HTTPS сертификаты
- [ ] **Переопределить FRONTEND_URL** - установить production URL фронтенда в переменных окружения

### Высокий приоритет

- [ ] **Автоматическое создание раундов** - настроить @nestjs/schedule для автоматических раундов
- [ ] **Глобальный rate limiting на Nginx** - защита от DDoS на уровне балансировщика
- [ ] **Логирование** - добавить Winston или аналог для структурированных логов
- [ ] **Мониторинг** - настроить Prometheus/Grafana для метрик

### Средний приоритет

- [ ] **Увеличить JWT TTL** - 1 час может быть недостаточно для production
- [ ] **Database connection pooling** - оптимизировать настройки Prisma для нагрузки
- [ ] **Graceful shutdown** - корректное завершение при перезапуске инстансов
- [ ] **Error tracking** - интеграция с Sentry или аналогом

### Готовность к production

**Текущий статус:** ~70%

**Сильные стороны:**
- Правильная архитектура для горизонтального масштабирования
- Транзакции для предотвращения race conditions
- Health check endpoints для мониторинга
- Валидация и безопасность на базовом уровне

**Требует доработки:**
- Rate limiting для multi-instance окружения
- Production-ready инфраструктура (SSL, логирование, мониторинг)

---

## Решение проблем

### CORS ошибки

Убедитесь, что `FRONTEND_URL` в backend `.env` совпадает с URL фронтенда:
```env
FRONTEND_URL="http://localhost:5173"
```

### Ошибка подключения к БД

Проверьте, что PostgreSQL запущен:
```bash
brew services list | grep postgresql
# или
docker ps | grep postgres
```

### Frontend не подключается к backend

1. Проверьте, что backend запущен: `curl http://localhost:3000`
2. Проверьте `VITE_API_URL` в frontend `.env`
3. Откройте Dev Tools -> Network и проверьте запросы

> Полный список проблем и решений: `/Users/sunshad0w/Work/tests/goose/docs/integration.md`

---

## Документация

- **Интеграция и запуск**: [`docs/integration.md`](/Users/sunshad0w/Work/tests/goose/docs/integration.md)
- **Backend API**: [`backend/README.md`](/Users/sunshad0w/Work/tests/goose/backend/README.md)
- **Frontend**: [`frontend/README.md`](/Users/sunshad0w/Work/tests/goose/frontend/README.md)

---

## Лицензия

MIT

---

## Контакты и поддержка

При возникновении вопросов:

1. Проверьте документацию в `docs/integration.md`
2. Изучите README в соответствующей папке (backend/frontend)
3. Проверьте логи приложения и браузера

---

**Версия:** 1.0.0
**Дата:** 2025-11-17
**Статус:** Active Development
