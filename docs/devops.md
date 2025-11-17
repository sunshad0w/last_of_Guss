# DevOps Документация

> **Краткая сводка DevOps окружения. Полная документация доступна в prd.md**

## 1. Архитектура развертывания

### Схема Multi-Instance Setup

```
                    Пользователи
                         │
                         ▼
                ┌─────────────────┐
                │  Reverse Proxy  │
                │     (nginx)     │
                └────────┬────────┘
                         │ Load Balancing
                    ┌────┴────┬────────┐
                    ▼         ▼        ▼
              ┌─────────┬─────────┬─────────┐
              │ Node.js │ Node.js │ Node.js │
              │ App #1  │ App #2  │ App #3  │
              │ :3000   │ :3001   │ :3002   │
              └────┬────┴────┬────┴────┬────┘
                   │         │         │
                   └────┬────┴────┬────┘
                        ▼         ▼
                   ┌──────────────────┐
                   │   PostgreSQL     │
                   │   Database       │
                   └──────────────────┘
```

### Ключевые принципы

- **Stateless бекенд** - все состояние хранится в БД
- **Горизонтальное масштабирование** - поддержка 3+ инстансов
- **No session affinity** - запросы распределяются по любому инстансу
- **Атомарные операции** - транзакции БД для предотвращения race conditions

---

## 2. Переменные окружения

### Backend (.env)

```bash
# Database Connection
DATABASE_URL="postgresql://user:password@localhost:5432/goose_game"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRATION="24h"

# Game Configuration
ROUND_DURATION=60           # Длительность раунда в секундах
COOLDOWN_DURATION=30        # Длительность cooldown перед стартом

# Server Configuration
PORT=3000                   # Порт приложения (3000, 3001, 3002 для разных инстансов)
NODE_ENV="development"      # development | production | test

# CORS Settings
FRONTEND_URL="http://localhost:5173"
```

### Frontend (.env)

```bash
VITE_API_URL="http://localhost:3000"
```

### Production Настройки

```bash
# Обязательно изменить в production:
JWT_SECRET="<сгенерировать длинный случайный ключ>"
NODE_ENV="production"
DATABASE_URL="postgresql://<prod-host>:5432/goose_game?ssl=true"
FRONTEND_URL="https://yourdomain.com"
```

---

## 3. Команды запуска

### Backend

```bash
# Установка зависимостей
npm install

# Применение миграций БД
npx prisma migrate deploy

# Development режим
npm run dev

# Build для production
npm run build

# Production запуск
node dist/index.js

# Тестирование
npm test
```

### Frontend

```bash
# Установка зависимостей
npm install

# Development сервер
npm run dev

# Build для production
npm run build

# Preview production build
npm run preview

# Тестирование
npm test
```

---

## 4. Настройка Development окружения

### Шаг 1: Database Setup

```bash
# Установка PostgreSQL (macOS)
brew install postgresql@15
brew services start postgresql@15

# Создание БД
createdb goose_game

# Создать .env файл в backend/
DATABASE_URL="postgresql://localhost:5432/goose_game"
```

### Шаг 2: Backend Setup

```bash
cd backend
npm install
npx prisma migrate dev       # Применить миграции
npx prisma generate          # Сгенерировать Prisma Client
npm run dev                  # Запуск на порту 3000
```

### Шаг 3: Frontend Setup

```bash
cd frontend
npm install
npm run dev                  # Запуск на порту 5173
```

---

## 5. Production Deployment

### Один инстанс (простой вариант)

```bash
# 1. Подготовка
git clone <repo>
cd backend
npm install
npm run build

# 2. Настройка БД
export DATABASE_URL="postgresql://..."
npx prisma migrate deploy

# 3. Запуск
export NODE_ENV=production
export PORT=3000
export JWT_SECRET="<your-secret>"
node dist/index.js
```

### Несколько инстансов (рекомендуется)

```bash
# Терминал 1 - Instance #1
export PORT=3000
node dist/index.js

# Терминал 2 - Instance #2
export PORT=3001
node dist/index.js

# Терминал 3 - Instance #3
export PORT=3002
node dist/index.js
```

### Nginx Reverse Proxy

```nginx
upstream backend {
    # Round-robin балансировка
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    listen 80;
    server_name yourdomain.com;

    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location / {
        # Статические файлы фронтенда
        root /var/www/frontend;
        try_files $uri /index.html;
    }
}
```

---

## 6. Масштабирование

### Горизонтальное масштабирование

**Требования для добавления инстансов:**

- ✅ Stateless архитектура (все состояние в БД)
- ✅ Нет in-memory хранилища
- ✅ Транзакции БД для критичных операций
- ✅ Уникальные порты для каждого инстанса
- ✅ Load balancer (nginx/HAProxy)

**Метрики для масштабирования:**

- CPU > 70% на протяжении 5+ минут → добавить инстанс
- Response time > 200ms → добавить инстанс
- Concurrent users > 100 на инстанс → добавить инстанс

**Bottlenecks:**

- PostgreSQL - до ~1000 concurrent users на один инстанс БД
- Для большей нагрузки рассмотреть read replicas

### Вертикальное масштабирование БД

```bash
# Connection pooling в Prisma
DATABASE_URL="postgresql://...?connection_limit=20"
```

---

## 7. Мониторинг и логирование

### Health Check Endpoint

```bash
# Проверка здоровья инстанса
curl http://localhost:3000/health

# Ожидаемый ответ:
{
  "status": "ok",
  "database": "connected",
  "uptime": 3600
}
```

### Базовый мониторинг

**Метрики для отслеживания:**

- Response time (`/rounds/:id/tap` - критичен)
- Error rate (4xx, 5xx)
- Database connection pool
- Active rounds count
- Requests per second

**Логирование:**

```typescript
// NestJS Logger
import { Logger } from '@nestjs/common';

const logger = new Logger('AppName');

logger.log('Round created', { roundId, userId });
logger.error('Tap failed', { error, roundId, userId });
logger.warn('High load detected', { rps: 1000 });
```

### Production Logs

```bash
# Запуск с логами в файл
node dist/index.js >> /var/log/goose-app.log 2>&1

# Просмотр логов
tail -f /var/log/goose-app.log

# Ротация логов (logrotate)
# /etc/logrotate.d/goose-app
/var/log/goose-app.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
}
```

### Простой мониторинг с помощью systemd

```ini
# /etc/systemd/system/goose-backend@.service
[Unit]
Description=Goose Game Backend Instance %i
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/goose/backend
Environment="NODE_ENV=production"
Environment="PORT=300%i"
EnvironmentFile=/var/www/goose/backend/.env
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Запуск:
```bash
systemctl enable goose-backend@0
systemctl start goose-backend@0

systemctl enable goose-backend@1
systemctl start goose-backend@1

systemctl enable goose-backend@2
systemctl start goose-backend@2
```

---

## 8. Резервное копирование БД

```bash
# Backup
pg_dump goose_game > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
psql goose_game < backup_20250117_120000.sql

# Автоматический бэкап (cron)
0 2 * * * pg_dump goose_game | gzip > /backups/goose_$(date +\%Y\%m\%d).sql.gz
```

---

## 9. Безопасность

### Обязательные меры

- ✅ Изменить `JWT_SECRET` на случайную строку (минимум 32 символа)
- ✅ PostgreSQL с паролем (не пустой)
- ✅ SSL для БД в production (`?ssl=true`)
- ✅ Rate limiting на API endpoints
- ✅ CORS настроен только на доверенные домены
- ✅ Helmet.js для HTTP security headers
- ✅ Input validation на всех endpoints

### SSL/HTTPS

```bash
# Certbot для Let's Encrypt
certbot --nginx -d yourdomain.com
```

---

## 10. Troubleshooting

### Проблема: Race conditions при тапах

**Решение:** Убедитесь, что используются транзакции БД

```typescript
// Правильно - с транзакцией
await prisma.$transaction(async (tx) => {
  const round = await tx.round.findFirst(...);
  const stats = await tx.roundStats.upsert(...);
});

// Неправильно - без транзакции
const round = await prisma.round.findFirst(...);
const stats = await prisma.roundStats.upsert(...);
```

### Проблема: Инстансы не распределяют нагрузку

**Проверка nginx:**
```bash
# Проверить конфиг
nginx -t

# Перезапустить
systemctl reload nginx

# Логи
tail -f /var/log/nginx/access.log
```

### Проблема: Database connection pool exhausted

**Решение:** Увеличить connection limit
```bash
DATABASE_URL="postgresql://...?connection_limit=50"
```

---

## 11. Полезные команды

```bash
# Проверка портов
lsof -i :3000

# Убить процесс на порту
kill $(lsof -t -i:3000)

# Проверка БД соединения
psql $DATABASE_URL -c "SELECT 1"

# Prisma Studio (GUI для БД)
npx prisma studio

# Проверка всех инстансов
for port in 3000 3001 3002; do
  curl -s http://localhost:$port/health | jq
done
```

---

## Контрольный чеклист для деплоя

- [ ] PostgreSQL установлен и запущен
- [ ] `.env` файлы созданы и заполнены
- [ ] `JWT_SECRET` изменен на случайное значение
- [ ] Миграции БД применены (`prisma migrate deploy`)
- [ ] Backend собран (`npm run build`)
- [ ] Несколько инстансов запущены на разных портах
- [ ] Nginx настроен и запущен
- [ ] Health checks работают для всех инстансов
- [ ] Frontend собран и размещен
- [ ] CORS настроен корректно
- [ ] SSL сертификат установлен (production)
- [ ] Логирование настроено
- [ ] Backup БД настроен

---

**Примечание:** Для Docker/Kubernetes развертывания см. раздел 14.3 в prd.md
