# The Last of Guss - Frontend

React + TypeScript + Vite приложение для игры "The Last of Guss"

## Установка и запуск

### 1. Установка зависимостей

```bash
cd /Users/sunshad0w/Work/tests/goose/frontend
npm install
```

### 2. Установка shadcn/ui компонентов

После установки зависимостей установите необходимые UI компоненты через CLI:

```bash
# Добавить недостающую зависимость
npm install tailwindcss-animate

# Установить компоненты shadcn/ui (они перезапишут placeholder файлы)
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
```

### 3. Настройка переменных окружения

Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

Откройте `.env` и укажите URL вашего backend API:

```
VITE_API_URL=http://localhost:3000
```

### 4. Запуск в режиме разработки

```bash
npm run dev
```

Приложение будет доступно по адресу: http://localhost:5173

### 5. Сборка для production

```bash
npm run build
```

Собранные файлы будут в папке `dist/`

## Структура проекта

```
frontend/
├── src/
│   ├── components/       # React компоненты
│   │   └── ui/          # shadcn/ui компоненты
│   ├── context/         # React Context (AuthContext)
│   ├── hooks/           # Кастомные хуки
│   ├── pages/           # Страницы приложения
│   ├── services/        # API сервисы
│   ├── types/           # TypeScript типы
│   ├── utils/           # Утилиты
│   ├── lib/             # Библиотеки (utils для shadcn)
│   ├── App.tsx          # Корневой компонент с роутингом
│   ├── main.tsx         # Entry point
│   └── index.css        # Глобальные стили
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Основные технологии

- **React 18** - UI библиотека
- **TypeScript** (strict mode) - Типизация
- **Vite** - Сборщик и dev server
- **React Router v6** - Роутинг
- **shadcn/ui + Radix UI** - UI компоненты
- **Tailwind CSS** - Стилизация
- **Axios** - HTTP клиент
- **sonner** - Toast уведомления

## Страницы

1. **/login** - Страница авторизации
2. **/rounds** - Список раундов (активные, запланированные, завершенные)
3. **/rounds/:id** - Страница раунда с тремя состояниями:
   - **Cooldown** - обратный отсчет до начала
   - **Active** - активная игра с тапами
   - **Completed** - результаты раунда

## Роли пользователей

- **survivor** (по умолчанию) - обычный игрок
- **nikita** - специальная роль (тапы не дают очков)
- **admin** - может создавать раунды

Роли назначаются автоматически на основе username:
- "admin" → admin
- "Никита" → nikita
- остальные → survivor

## API

Frontend ожидает следующие эндпоинты от backend:

```
POST   /auth/login          - Авторизация
GET    /rounds              - Список раундов
POST   /rounds              - Создание раунда (admin)
GET    /rounds/:id          - Детали раунда
POST   /rounds/:id/tap      - Тап по гусю
```

## Следующие шаги

1. Запустить backend сервер (см. документацию в `/docs`)
2. Установить все зависимости и shadcn компоненты
3. Настроить `.env` файл
4. Запустить frontend в режиме разработки
5. Открыть браузер на http://localhost:5173

## Разработка

- Все компоненты используют TypeScript strict mode
- API ошибки обрабатываются централизованно через Axios interceptor
- Toast уведомления показываются автоматически
- Оптимистичные обновления UI при тапах
- Автообновление данных раундов (polling)

## Документация

Полная документация проекта:
- `/docs/prd.md` - Product Requirements Document
- `/docs/ui.md` - UI/UX дизайн
- `/docs/front.md` - Frontend архитектура
