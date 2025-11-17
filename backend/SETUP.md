# Инструкция по запуску Backend

## Быстрый старт

### 1. Установка зависимостей

```bash
cd backend
npm install
```

### 2. Настройка базы данных

Создайте файл `.env`:

```bash
cp .env.example .env
```

Отредактируйте `.env` и укажите URL PostgreSQL:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/goose_game"
```

### 3. Применение миграций

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Запуск сервера

```bash
npm run start:dev
```

Сервер запустится на `http://localhost:3000`

## Проверка работоспособности

### 1. Создание пользователя

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

Ответ:
```json
{
  "accessToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "username": "admin",
    "role": "ADMIN"
  }
}
```

### 2. Создание раунда (от имени admin)

```bash
TOKEN="<accessToken_from_previous_step>"

# Раунд через 10 секунд
START_TIME=$(date -u -v+10S +"%Y-%m-%dT%H:%M:%S.000Z")

curl -X POST http://localhost:3000/rounds \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"startTime\": \"$START_TIME\"}"
```

### 3. Получение списка раундов

```bash
curl http://localhost:3000/rounds \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Тап по гусю (после начала раунда)

```bash
ROUND_ID="<round_id_from_previous_step>"

curl -X POST http://localhost:3000/rounds/$ROUND_ID/tap \
  -H "Authorization: Bearer $TOKEN"
```

## Структура проекта

```
backend/
├── src/
│   ├── auth/                 # Аутентификация
│   │   ├── dto/
│   │   ├── strategies/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── rounds/              # Управление раундами
│   │   ├── dto/
│   │   ├── rounds.controller.ts
│   │   ├── rounds.service.ts
│   │   └── rounds.module.ts
│   ├── taps/                # Обработка тапов
│   │   ├── guards/          # Rate limiting
│   │   ├── taps.controller.ts
│   │   ├── taps.service.ts
│   │   └── taps.module.ts
│   ├── prisma/              # База данных
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── common/              # Общие компоненты
│   │   ├── guards/
│   │   ├── decorators/
│   │   └── filters/
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   └── schema.prisma
├── .env.example
└── package.json
```

## Ключевые технические решения

### 1. Транзакции для тапов

```typescript
// taps/taps.service.ts
await this.prisma.$transaction(async (tx) => {
  // Атомарная обработка:
  // 1. Чтение текущего счетчика
  // 2. Определение бонусного тапа
  // 3. Обновление статистики игрока
  // 4. Обновление общей статистики раунда
});
```

**Зачем**: Предотвращение race conditions при конкурентных запросах.

### 2. Rate Limiting

```typescript
// taps/guards/rate-limit.guard.ts
// Максимум 10 тапов в секунду на пользователя
// In-memory кеш с автоочисткой
```

**Зачем**: Защита от autoclicker'ов и ботов.

### 3. Роль Никита

```typescript
// taps/taps.service.ts
const pointsToAdd = userRole === UserRole.NIKITA ? 0 : earnedPoints;
```

**Зачем**: Тестирование системы без влияния на результаты.

### 4. Бонусные тапы

```typescript
// Каждый 11-й тап ГЛОБАЛЬНО (по Round.totalTaps)
const isBonus = (currentRound.totalTaps + 1) % 11 === 0;
const earnedPoints = isBonus ? 10 : 1;
```

### 5. Grace Period

```typescript
// Тапы засчитываются в течение 1 секунды после endTime
const graceEndTime = new Date(round.endTime.getTime() + 1000);
```

## Тестирование конкурентности

### Скрипт для проверки race conditions

```bash
#!/bin/bash

TOKEN="<your_token>"
ROUND_ID="<your_round_id>"

# Отправляем 50 тапов параллельно
for i in {1..50}; do
  curl -X POST http://localhost:3000/rounds/$ROUND_ID/tap \
    -H "Authorization: Bearer $TOKEN" \
    -s &
done

wait

echo "Все тапы отправлены!"
```

**Ожидаемый результат**: Все тапы должны быть корректно обработаны без потери данных.

## Production Checklist

- [ ] Изменить `JWT_SECRET` на криптостойкий ключ
- [ ] Настроить PostgreSQL connection pooling
- [ ] Настроить CORS для production URL
- [ ] Использовать Redis для rate limiting (масштабируемость)
- [ ] Настроить SSL через reverse proxy
- [ ] Включить логирование (Winston/Pino)
- [ ] Настроить monitoring (Prometheus/Grafana)
- [ ] Применить миграции через `npm run prisma:deploy`

## Полезные команды

```bash
# Генерация Prisma Client
npm run prisma:generate

# Создание миграции
npm run prisma:migrate

# Prisma Studio (GUI для БД)
npm run prisma:studio

# Форматирование кода
npm run format

# Линтинг
npm run lint

# Тесты
npm run test
```

## Troubleshooting

### Ошибка подключения к БД

```
Error: P1001: Can't reach database server
```

**Решение**: Проверьте, что PostgreSQL запущен и `DATABASE_URL` в `.env` правильный.

### JWT ошибки

```
UnauthorizedException: Пользователь не найден
```

**Решение**: Проверьте, что токен не истек и `JWT_SECRET` одинаковый в `.env` и при генерации токена.

### Rate Limiting срабатывает постоянно

```
429 Too Many Requests
```

**Решение**: Уменьшите частоту запросов или увеличьте `RATE_LIMIT_TAPS_PER_SECOND` в `.env`.

## API Документация

Полная документация доступна в `/docs/api.md`
