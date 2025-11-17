# API Документация

> **Краткая сводка REST API. Полная документация доступна в prd.md**

## Базовая информация

**Base URL:** `http://localhost:3000`
**Формат данных:** JSON
**Аутентификация:** JWT Bearer Token

---

## Аутентификация

### Формат заголовка

```http
Authorization: Bearer <JWT_TOKEN>
```

### Структура JWT токена

**Payload:**
```json
{
  "sub": "user-uuid",
  "username": "Иван",
  "role": "survivor | nikita | admin",
  "iat": 1700000000,
  "exp": 1700086400
}
```

**Срок действия:** 24 часа (настраивается через `JWT_EXPIRATION`)

---

## Эндпоинты

### 1. POST /auth/login

**Описание:** Вход пользователя (создание нового или вход в существующий аккаунт)

**Request:**
```json
{
  "username": "string (min: 1, max: 50)",
  "password": "string (min: 8, max: 100)"
}
```

**Response (201/200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "string",
    "role": "survivor | nikita | admin"
  }
}
```

**Errors:**
- `400 Bad Request` - Ошибки валидации
- `401 Unauthorized` - Неверный пароль

---

### 2. GET /rounds

**Описание:** Получить список всех раундов

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response (200):**
```json
{
  "rounds": [
    {
      "id": "uuid",
      "startTime": "2025-11-17T15:00:00.000Z",
      "endTime": "2025-11-17T15:01:00.000Z",
      "status": "active | cooldown | completed",
      "totalTaps": 123,
      "totalPoints": 145
    }
  ]
}
```

**Сортировка:** active → cooldown → completed, внутри группы по времени старта (DESC)

**Errors:**
- `401 Unauthorized` - Не авторизован

---

### 3. POST /rounds

**Описание:** Создать новый раунд (только для администраторов)

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Request:**
```json
{
  "startTime": "2025-11-17T15:00:00.000Z"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "startTime": "2025-11-17T15:00:00.000Z",
  "endTime": "2025-11-17T15:01:00.000Z",
  "status": "cooldown",
  "totalTaps": 0,
  "totalPoints": 0,
  "createdAt": "2025-11-17T14:59:00.000Z"
}
```

**Errors:**
- `400 Bad Request` - Время старта в прошлом
- `403 Forbidden` - Недостаточно прав (требуется роль admin)
- `401 Unauthorized` - Не авторизован

---

### 4. GET /rounds/:id

**Описание:** Получить детальную информацию о раунде

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response (200) - Активный/Cooldown раунд:**
```json
{
  "id": "uuid",
  "startTime": "2025-11-17T15:00:00.000Z",
  "endTime": "2025-11-17T15:01:00.000Z",
  "status": "active",
  "totalTaps": 450,
  "totalPoints": 520,
  "myStats": {
    "taps": 25,
    "points": 27
  }
}
```

**Response (200) - Завершенный раунд:**
```json
{
  "id": "uuid",
  "startTime": "2025-11-17T15:00:00.000Z",
  "endTime": "2025-11-17T15:01:00.000Z",
  "status": "completed",
  "totalTaps": 999,
  "totalPoints": 1234,
  "winner": {
    "username": "Иван",
    "points": 105
  },
  "myStats": {
    "taps": 42,
    "points": 45
  }
}
```

**Примечания:**
- `myStats` = `null` если пользователь не участвовал в раунде
- `winner` = `null` если раунд еще не завершен

**Errors:**
- `404 Not Found` - Раунд не найден
- `401 Unauthorized` - Не авторизован

---

### 5. POST /rounds/:id/tap

**Описание:** Зарегистрировать тап по гусю

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:** Пустой или опциональный timestamp для grace period

**Response (200) - Обычный тап:**
```json
{
  "taps": 26,
  "points": 28,
  "earnedPoints": 1,
  "isBonus": false
}
```

**Response (200) - Бонусный тап (каждый 11-й глобально):**
```json
{
  "taps": 33,
  "points": 50,
  "earnedPoints": 10,
  "isBonus": true
}
```

**Response (200) - Никита (фантомные тапы):**
```json
{
  "taps": 100,
  "points": 0,
  "earnedPoints": 0,
  "isBonus": false
}
```

**Errors:**
- `400 Bad Request` - Раунд неактивен
- `404 Not Found` - Раунд не найден
- `429 Too Many Requests` - Превышен лимит (макс. 10 тапов/сек)
- `401 Unauthorized` - Не авторизован

---

## Модели данных

### User
```typescript
{
  id: string;           // UUID
  username: string;     // 1-50 символов, уникальный
  role: UserRole;       // "survivor" | "nikita" | "admin"
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

**Роли:**
- `survivor` - обычный игрок (получает очки)
- `nikita` - фантомный игрок (тапы без очков)
- `admin` - администратор (может создавать раунды)

### Round
```typescript
{
  id: string;           // UUID
  startTime: DateTime;  // Время старта раунда
  endTime: DateTime;    // startTime + 60 секунд
  status: RoundStatus;  // "cooldown" | "active" | "completed"
  totalTaps: number;    // Общее количество тапов
  totalPoints: number;  // Общее количество очков
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

**Статусы:**
- `cooldown` - до начала раунда (startTime > now)
- `active` - раунд идет (startTime ≤ now < endTime)
- `completed` - раунд завершен (now ≥ endTime)

### RoundStats
```typescript
{
  id: string;           // UUID
  roundId: string;      // UUID раунда
  userId: string;       // UUID пользователя
  taps: number;         // Количество тапов пользователя
  points: number;       // Количество очков пользователя
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

**Ограничения:**
- Уникальная пара (roundId, userId) - один пользователь = одна запись на раунд

---

## Формат ошибок

**Стандартная структура:**
```json
{
  "statusCode": 400,
  "message": "Описание ошибки" | ["Массив ошибок валидации"],
  "error": "Bad Request"
}
```

**HTTP коды:**
- `200 OK` - Успешный запрос
- `201 Created` - Ресурс создан
- `400 Bad Request` - Ошибка валидации или бизнес-логики
- `401 Unauthorized` - Не авторизован или неверные учетные данные
- `403 Forbidden` - Недостаточно прав
- `404 Not Found` - Ресурс не найден
- `429 Too Many Requests` - Превышен rate limit
- `500 Internal Server Error` - Ошибка сервера

---

## Rate Limiting

**Глобальный лимит:**
- 100 запросов в минуту на IP-адрес

**Tap endpoint:**
- Максимум 10 тапов в секунду на пользователя
- При превышении: HTTP 429 с сообщением "Слишком много запросов. Максимум 10 тапов в секунду"

**Реализация:**
- In-memory cache или Redis (для масштабирования)
- TTL-based ключи: `rate-limit:${userId}:${roundId}`

---

## CORS

**Разрешенные origins:**
```
http://localhost:5173 (development)
```

**Credentials:** Разрешены

**Настройка через переменную окружения:**
```bash
FRONTEND_URL="http://localhost:5173"
```

---

## Дополнительная логика

### Бонусные очки
- Каждый **11-й тап глобально** (по всем пользователям) получает **+10 очков** вместо +1
- `Round.totalTaps % 11 === 0` → бонусный тап
- Возвращается `isBonus: true` в ответе

### Роль Nikita
- Тапы засчитываются (`taps++`)
- Очки **не начисляются** (`points` остается 0)
- Не учитывается при определении победителя

### Grace Period
- Тапы, отправленные в течение **1 секунды** после `endTime`, засчитываются
- Реализация: проверка `timestamp` в payload запроса или мягкая граница `endTime + 1s`

### Определение победителя
- Максимальное значение `RoundStats.points` в раунде
- Роль `nikita` исключается из подсчета
- В случае равенства очков - победитель с меньшим количеством тапов (лучшая эффективность)

---

## Примеры использования

### Полный flow авторизации и игры

```typescript
// 1. Логин
const loginResponse = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'Иван',
    password: 'password123'
  })
});
const { accessToken } = await loginResponse.json();

// 2. Получить список раундов
const roundsResponse = await fetch('http://localhost:3000/rounds', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
const { rounds } = await roundsResponse.json();

// 3. Получить детали активного раунда
const roundId = rounds.find(r => r.status === 'active')?.id;
const roundResponse = await fetch(`http://localhost:3000/rounds/${roundId}`, {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
const roundData = await roundResponse.json();

// 4. Тапнуть по гусю
const tapResponse = await fetch(`http://localhost:3000/rounds/${roundId}/tap`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
const tapResult = await tapResponse.json();
console.log(`Очки: ${tapResult.points}, Заработано: ${tapResult.earnedPoints}`);
```

### Создание раунда (только для admin)

```typescript
const createRoundResponse = await fetch('http://localhost:3000/rounds', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    startTime: new Date(Date.now() + 60000).toISOString() // Старт через 1 минуту
  })
});
const newRound = await createRoundResponse.json();
```

---

## Переменные окружения

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/goose_game"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRATION="24h"

# Server
PORT=3000
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:5173"

# Rate Limiting
RATE_LIMIT_TAPS_PER_SECOND=10
RATE_LIMIT_GLOBAL_PER_MINUTE=100

# Redis (опционально)
REDIS_URL="redis://localhost:6379"
```

---

## WebSocket (опционально)

**Для real-time обновлений раундов:**

```typescript
// Backend
@WebSocketGateway({ cors: true })
export class RoundsGateway {
  @WebSocketServer()
  server: Server;

  broadcastRoundUpdate(roundId: string, data: any) {
    this.server.to(roundId).emit('roundUpdate', data);
  }
}

// Frontend
const socket = io('ws://localhost:3000');
socket.emit('joinRound', roundId);
socket.on('roundUpdate', (data) => {
  // Обновить UI без polling
});
```

**Преимущества:**
- Мгновенные обновления счетчиков
- Снижение нагрузки на сервер
- Лучший UX

---

## Рекомендации для фронтенда

### Работа с таймерами
- **Source of truth:** `startTime` и `endTime` от сервера
- **Client-side расчет:** `Math.max(0, endTime - Date.now())`
- **Обновление:** каждую секунду через `setInterval`
- **Переключение статуса:** автоматически при достижении 00:00

### Обработка тапов
- Отправлять запрос **без debounce** для максимальной скорости
- **Оптимистичное обновление:** увеличивать счетчик локально до получения ответа
- **Rollback при ошибке:** откатывать изменения при 4xx/5xx
- **Обработка 429:** показать toast "Слишком быстро!"

### Автообновление списка раундов
- **Polling:** каждые 5 секунд
- **Плавное обновление:** без "мигания" интерфейса
- **Кнопка обновления:** для ручного обновления

### Хранение токена
- **localStorage** или **sessionStorage**
- **Не использовать cookies** (иммунитет к CSRF)
- **Проверка истечения:** декодировать JWT и проверить `exp`
- **Автоматический logout:** при истечении или 401 ошибке

---

**Полная документация проекта:** [prd.md](./prd.md)
