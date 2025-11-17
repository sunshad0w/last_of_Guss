# Product Requirements Document (PRD)
# "The Last of Guss"

**Версия документа:** 1.0
**Дата создания:** 2025-11-17
**Автор:** Product Team
**Статус:** Утверждено к разработке

---

## 1. Executive Summary

### 1.1 Краткое описание продукта

"The Last of Guss" - браузерная соревновательная игра, в которой игроки конкурируют, кто быстрее и результативнее натапает по виртуальному гусю, подхватившему мутацию G-42. Игра организована в формате раундов с фиксированным временем, уникальной системой подсчета очков и ролевым распределением игроков.

### 1.2 Бизнес-цели

- **Основная цель:** Создать увлекательную многопользовательскую браузерную игру с соревновательным элементом
- **Технические цели:** Демонстрация навыков разработки масштабируемых real-time веб-приложений
- **Метрики успеха:**
  - Поддержка 10+ одновременных игроков в раунде без деградации производительности
  - Время отклика API < 100ms для операций тапа
  - 100% консистентность данных при конкурентных запросах
  - Возможность горизонтального масштабирования до 3+ инстансов бекенда

### 1.3 Ресурсы и требования

**Backend:**
- NestJS + TypeScript (strict mode)
- Prisma ORM + PostgreSQL
- JWT аутентификация
- bcrypt для хеширования паролей

**Frontend:**
- React + TypeScript + Vite
- React Router
- **shadcn/ui + Radix UI + Tailwind CSS** (UI библиотека)
- **sonner** (toast уведомления)

**Инфраструктура:**
- PostgreSQL (1 инстанс)
- Node.js приложения (масштабируемо до 3+)
- Reverse proxy (nginx/аналог)

### 1.4 Оценка рисков

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Race conditions при конкурентных тапах | Высокая | Критическое | Использование транзакций БД с row-level locking |
| Проблемы синхронизации таймеров | Средняя | Среднее | Client-side таймеры с серверным временем как source of truth |
| Autoclicker атаки | Высокая | Среднее | Rate limiting: максимум 10 тапов/секунду |
| Несогласованность между инстансами | Средняя | Критическое | Stateless архитектура, вся логика через БД |

---

## 2. Постановка задачи и цели проекта

### 2.1 Проблема

Необходимо создать браузерную многопользовательскую игру, которая:
- Обеспечивает честную конкуренцию между игроками
- Корректно обрабатывает конкурентные запросы от множества пользователей
- Масштабируется горизонтально без потери консистентности данных
- Предоставляет real-time опыт без постоянного WebSocket соединения

### 2.2 Решение

Создание веб-приложения с:
- REST API бекендом на NestJS с транзакционной логикой обработки тапов
- React фронтендом с оптимистичными обновлениями UI
- Раундовой системой игры с четкими состояниями (Cooldown → Active → Completed)
- Ролевой моделью пользователей (Survivor, Nikita, Admin)
- Системой подсчета очков с бонусами за каждый 11-й тап

### 2.3 Ключевые особенности

1. **Уникальная система подсчета очков:**
   - Базовый тап = 1 очко
   - Каждый 11-й тап (глобальный счетчик раунда) = 10 очков
   - Тапы игрока "Никита" регистрируются, но не дают очков

2. **Гибкое управление раундами:**
   - Админ указывает точное время старта при создании
   - Автоматический переход между состояниями
   - Поддержка множественных одновременных раундов

3. **Масштабируемая архитектура:**
   - Stateless бекенд
   - Горизонтальное масштабирование
   - Атомарные операции в БД

---

## 3. Пользовательские персоны

### 3.1 Персона: Выживший (Survivor)

**Описание:** Обычный игрок
**Роль в системе:** `survivor`
**Права доступа:**
- Просмотр списка раундов
- Участие в активных раундах (тапы)
- Просмотр собственной статистики
- Просмотр финальных результатов завершенных раундов

**Цели:**
- Набрать максимальное количество очков
- Победить в раунде
- Соревноваться с другими игроками

**Сценарии использования:**
1. Входит в систему (или регистрируется)
2. Выбирает активный/запланированный раунд
3. Ждет начала раунда (если в cooldown)
4. Активно тапает по гусю во время раунда
5. Отслеживает свой счет в реальном времени
6. Просматривает результаты после завершения

**Боли:**
- Неопределенность по поводу точности подсчета очков
- Технические задержки, влияющие на конкурентоспособность
- Непонятные правила начисления бонусов

### 3.2 Персона: Никита

**Описание:** Специальный игрок с "фантомными" тапами
**Роль в системе:** `nikita`
**Права доступа:**
- Те же, что у Survivor
- Тапы регистрируются, но не дают очков

**Особенности:**
- Username точно "Никита" (с заглавной буквы, регистрозависимо)
- Личный счет всегда отображается как 0
- Тапы НЕ увеличивают totalPoints раунда
- Запросы на тап обрабатываются идентично обычному игроку

**Цели:**
- Тестирование системы
- Участие в игре без влияния на результаты

**Сценарии использования:**
1. Входит под именем "Никита"
2. Видит все раунды
3. Может тапать, но видит счет 0
4. Не попадает в топ победителей

### 3.3 Персона: Администратор

**Описание:** Модератор игры
**Роль в системе:** `admin`
**Права доступа:**
- Все права Survivor
- Создание новых раундов с указанием точного времени старта
- Просмотр всех раундов (активных, запланированных, завершенных)

**Цели:**
- Организация регулярных игровых сессий
- Управление расписанием раундов
- Контроль над игровым процессом

**Сценарии использования:**
1. Входит под username "admin"
2. На странице списка раундов видит кнопку "Создать раунд"
3. Нажимает кнопку, указывает время старта
4. Раунд создается и автоматически переходит в cooldown
5. Может участвовать в раундах как обычный игрок

---

## 4. Функциональные требования

### 4.1 Система аутентификации

**FR-001: Регистрация/Вход пользователя**
- Пользователь вводит username и password
- Если пользователя не существует - создается новый аккаунт
- Если пользователь существует - проверяется пароль
- При успешной аутентификации выдается JWT token
- Минимальная длина пароля: 8 символов
- Username уникален в системе (регистрозависимо)

**FR-002: Назначение ролей**
- Роль определяется автоматически при создании пользователя на основе username:
  - username === "admin" → роль `admin`
  - username === "Никита" → роль `nikita`
  - все остальные → роль `survivor`
- Роль назначается один раз при создании и не изменяется

**FR-003: Хранение паролей**
- Пароли хешируются с помощью bcrypt
- Хеш сохраняется в поле `password_hash`
- Исходный пароль никогда не сохраняется

**FR-004: JWT токены**
- Токены передаются в заголовке `Authorization: Bearer <token>`
- Payload токена содержит: `userId`, `username`, `role`
- Токены имеют срок действия (рекомендовано: 24 часа)
- Refresh token механизм - опционально

### 4.2 Управление раундами

**FR-005: Создание раунда (только Admin)**
- Админ указывает точное время старта раунда (`startTime`)
- Система автоматически рассчитывает `endTime` = `startTime + ROUND_DURATION`
- Раунд создается со статусом "cooldown" если `startTime > currentTime + COOLDOWN_DURATION`
- При создании инициализируется `totalTaps = 0`, `totalPoints = 0`

**FR-006: Состояния раунда**

Раунд может находиться в одном из трех состояний:

1. **Cooldown (Запланирован):**
   - `currentTime < startTime`
   - Тапы не принимаются
   - Отображается обратный отсчет до старта

2. **Active (Активен):**
   - `startTime <= currentTime < endTime`
   - Тапы принимаются и обрабатываются
   - Отображается обратный отсчет до конца

3. **Completed (Завершен):**
   - `currentTime >= endTime`
   - Тапы не принимаются
   - Отображается финальная статистика и победитель

**FR-007: Конфигурация раундов**

Параметры из `.env`:
```bash
ROUND_DURATION=60      # Длительность раунда в секундах
COOLDOWN_DURATION=30   # Длительность cooldown в секундах
```

**FR-008: Множественные раунды**
- Система поддерживает наличие нескольких одновременных активных раундов
- Каждый раунд имеет уникальный UUID
- Статистика ведется отдельно для каждого раунда

**FR-009: Список раундов**

Возвращает раунды в категориях:
- **Активные:** статус Active
- **Запланированные:** статус Cooldown
- **Завершенные:** статус Completed (история)

Для каждого раунда показывается:
- ID раунда (UUID)
- Время старта (`startTime`)
- Время окончания (`endTime`)
- Текущий статус

### 4.3 Игровая механика (Тапы)

**FR-010: Обработка тапа**

Последовательность действий при тапе:

1. **Валидация JWT:** Проверка токена, извлечение `userId` и `role`
2. **Проверка статуса раунда:** Раунд должен быть в состоянии Active
3. **Транзакция БД** (атомарная операция):
   - Получение/создание записи `RoundStats` для пары `(roundId, userId)`
   - Инкремент `taps` для игрока
   - Инкремент `totalTaps` для раунда
   - Расчет очков на основе ГЛОБАЛЬНОГО счетчика `totalTaps`
   - Обновление `points` игрока (0 для роли `nikita`)
   - Обновление `totalPoints` раунда (не учитываются тапы `nikita`)
4. **Возврат ответа:** Актуальные данные игрока (`taps`, `points`)

**FR-011: Логика подсчета очков**

```typescript
// Псевдокод
const isEleventhTap = (round.totalTaps % 11 === 0);
const earnedPoints = isEleventhTap ? 10 : 1;

if (user.role === 'nikita') {
  playerStats.points = 0;  // Никита всегда имеет 0 очков
  // totalPoints раунда НЕ увеличивается
} else {
  playerStats.points += earnedPoints;
  round.totalPoints += earnedPoints;
}
```

**Ключевой момент:** Бонус за 11-й тап определяется ГЛОБАЛЬНЫМ счетчиком `totalTaps` всего раунда, а не персональным счетчиком игрока.

**FR-012: Grace Period для тапов**

- Тап считается валидным, если запрос отправлен ДО `endTime`
- Даже если запрос обработан сервером ПОСЛЕ `endTime`, он засчитывается
- Реализация: проверка времени отправки запроса (timestamp в payload) или использование мягкой границы (endTime + 1 секунда)

**FR-013: Rate Limiting**

- Максимум 10 тапов в секунду от одного пользователя
- Реализация: in-memory cache с TTL или Redis
- При превышении лимита возвращается HTTP 429 (Too Many Requests)
- Защита от autoclicker'ов и ботов

### 4.4 Статистика и лидерборд

**FR-014: Личная статистика в активном раунде**

Во время раунда игрок видит только свои данные:
- Количество собственных тапов
- Количество собственных очков
- НЕ видит статистику других игроков (до завершения раунда)

**FR-015: Лидерборд завершенного раунда**

После завершения раунда отображается:
- **Общая статистика раунда:**
  - Всего тапов в раунде
  - Всего очков в раунде
- **Победитель:**
  - Username победителя
  - Количество очков победителя
- **Личная статистика:**
  - Количество тапов игрока
  - Количество очков игрока
  - Позиция в рейтинге (опционально)

**FR-016: Определение победителя**

- Победитель = игрок с максимальным количеством очков (`points`)
- При равенстве очков: победитель = игрок с меньшим количеством тапов (эффективность)
- При полном равенстве: побеждает игрок, который первым достиг этого результата (по `created_at` записи статистики)
- Игрок с ролью `nikita` НЕ может быть победителем (всегда 0 очков)

---

## 5. User Stories с критериями приемки

### 5.1 Аутентификация

**US-001: Вход нового пользователя**

*As a* новый пользователь
*I want* иметь возможность войти с любым username/password
*So that* я могу начать играть без предварительной регистрации

**Acceptance Criteria:**
- **Given** пользователь открывает страницу логина
- **When** вводит username "Иван" и password "password123"
- **And** пользователя "Иван" не существует в БД
- **Then** создается новый пользователь с хешированным паролем
- **And** пользователю выдается JWT token
- **And** пользователь перенаправляется на страницу списка раундов
- **And** роль пользователя устанавливается как `survivor`

---

**US-002: Вход существующего пользователя**

*As a* существующий пользователь
*I want* войти используя свои учетные данные
*So that* я могу продолжить играть под своим аккаунтом

**Acceptance Criteria:**
- **Given** пользователь "Иван" существует в БД с паролем "password123"
- **When** пользователь вводит username "Иван" и password "password123"
- **Then** пароль верифицируется через bcrypt
- **And** пользователю выдается JWT token
- **And** пользователь перенаправляется на страницу списка раундов

---

**US-003: Ошибка при неверном пароле**

*As a* существующий пользователь
*I want* видеть ошибку при неверном пароле
*So that* я понимаю, что ввел неправильные данные

**Acceptance Criteria:**
- **Given** пользователь "Иван" существует с паролем "password123"
- **When** пользователь вводит username "Иван" и password "wrongpassword"
- **Then** запрос возвращает HTTP 401 Unauthorized
- **And** отображается сообщение об ошибке "Неверный пароль"
- **And** сообщение отображается под кнопкой входа

---

**US-004: Автоматическое назначение роли Админа**

*As a* пользователь с username "admin"
*I want* автоматически получить роль администратора
*So that* я могу управлять раундами

**Acceptance Criteria:**
- **Given** пользователь вводит username "admin" и password "admin123"
- **When** пользователь создается в системе
- **Then** роль пользователя устанавливается как `admin`
- **And** на странице списка раундов отображается кнопка "Создать раунд"

---

**US-005: Автоматическое назначение роли Никиты**

*As a* пользователь с username "Никита"
*I want* автоматически получить специальную роль
*So that* мои тапы не влияют на результаты раунда

**Acceptance Criteria:**
- **Given** пользователь вводит username "Никита" (с заглавной буквы)
- **When** пользователь создается в системе
- **Then** роль пользователя устанавливается как `nikita`
- **And** при тапах счет игрока всегда остается 0

---

### 5.2 Управление раундами

**US-006: Создание раунда администратором**

*As a* администратор
*I want* создавать новые раунды с указанием времени старта
*So that* игроки могут участвовать в запланированных игровых сессиях

**Acceptance Criteria:**
- **Given** пользователь с ролью `admin` авторизован
- **When** администратор нажимает кнопку "Создать раунд" на странице списка раундов
- **And** указывает время старта (например, через 2 минуты от текущего времени)
- **Then** создается новый раунд с уникальным UUID
- **And** `startTime` устанавливается равным указанному времени
- **And** `endTime` рассчитывается как `startTime + ROUND_DURATION`
- **And** раунд создается со статусом "cooldown"
- **And** администратор автоматически перенаправляется на страницу созданного раунда
- **And** отображается обратный отсчет до начала раунда

---

**US-007: Просмотр списка раундов**

*As a* любой авторизованный пользователь
*I want* видеть список всех раундов
*So that* я могу выбрать раунд для участия

**Acceptance Criteria:**
- **Given** пользователь авторизован
- **When** пользователь открывает страницу списка раундов (`/rounds`)
- **Then** отображаются следующие категории раундов:
  - **Активные раунды** (статус Active) - вверху списка
  - **Запланированные раунды** (статус Cooldown) - ниже активных
  - **Завершенные раунды** (статус Completed) - внизу списка
- **And** для каждого раунда отображается:
  - ID раунда (кликабельная ссылка)
  - Время старта
  - Время окончания
  - Текущий статус
- **And** ID раунда является ссылкой на страницу раунда

---

**US-008: Переход между состояниями раунда**

*As a* система
*I want* автоматически определять состояние раунда на основе времени
*So that* игроки видят актуальную информацию

**Acceptance Criteria:**
- **Given** раунд создан с `startTime = T1`, `endTime = T2`
- **When** `currentTime < T1`
- **Then** раунд имеет статус "Cooldown"
- **And** отображается "До начала раунда: MM:SS"

- **When** `T1 <= currentTime < T2`
- **Then** раунд имеет статус "Active"
- **And** отображается "До конца раунда: MM:SS"
- **And** гусь доступен для тапов

- **When** `currentTime >= T2`
- **Then** раунд имеет статус "Completed"
- **And** отображается финальная статистика
- **And** гусь недоступен для тапов

---

### 5.3 Игровой процесс

**US-009: Тап по гусю в активном раунде**

*As a* выживший (survivor)
*I want* тапать по гусю во время активного раунда
*So that* я могу набирать очки и конкурировать с другими игроками

**Acceptance Criteria:**
- **Given** раунд в состоянии Active
- **And** пользователь с ролью `survivor` авторизован
- **When** пользователь кликает на изображение гуся
- **Then** отправляется POST запрос на `/rounds/:id/tap`
- **And** сервер валидирует, что раунд активен
- **And** увеличивается счетчик тапов игрока на 1
- **And** увеличивается общий счетчик тапов раунда на 1
- **And** рассчитываются начисленные очки (1 или 10)
- **And** обновляются очки игрока
- **And** обновляются общие очки раунда
- **And** на странице отображается обновленный счет игрока
- **And** время отклика < 100ms (при нормальной нагрузке)

---

**US-010: Бонус за 11-й тап (глобальный счетчик)**

*As a* выживший
*I want* получать бонусные очки за каждый 11-й тап в раунде
*So that* я могу стратегически увеличивать свой счет

**Acceptance Criteria:**
- **Given** раунд активен с `totalTaps = 10`
- **When** любой игрок делает тап (11-й по счету в раунде)
- **Then** этот игрок получает +10 очков (вместо +1)
- **And** `totalTaps` становится равным 11
- **And** следующий тап (12-й) дает +1 очко

- **Given** `totalTaps = 21`
- **When** любой игрок делает тап (22-й по счету)
- **Then** этот игрок получает +10 очков
- **And** цикл повторяется каждые 11 тапов

---

**US-011: Фантомные тапы Никиты**

*As a* пользователь с ролью `nikita`
*I want* иметь возможность тапать
*So that* я могу участвовать в игре, но без влияния на результаты

**Acceptance Criteria:**
- **Given** раунд активен
- **And** пользователь "Никита" с ролью `nikita` авторизован
- **When** Никита кликает на гуся
- **Then** запрос обрабатывается успешно (HTTP 200)
- **And** увеличивается счетчик тапов Никиты
- **And** увеличивается общий счетчик `totalTaps` раунда
- **And** очки Никиты остаются равными 0
- **And** `totalPoints` раунда НЕ увеличивается
- **And** на странице отображается "Мои очки: 0"

---

**US-012: Тап в неактивном раунде**

*As a* выживший
*I want* получать понятную ошибку при попытке тапнуть в неактивном раунде
*So that* я понимаю, почему мой тап не засчитан

**Acceptance Criteria:**
- **Given** раунд в состоянии Cooldown или Completed
- **When** пользователь кликает на гуся
- **Then** запрос возвращает HTTP 400 Bad Request
- **And** отображается toast уведомление "Раунд неактивен"
- **And** счетчики игрока не изменяются

---

**US-013: Rate Limiting для защиты от autoclicker'ов**

*As a* система
*I want* ограничивать количество тапов в секунду
*So that* игра остается честной и защищена от ботов

**Acceptance Criteria:**
- **Given** пользователь авторизован в активном раунде
- **When** пользователь отправляет более 10 запросов на тап за 1 секунду
- **Then** запросы, превышающие лимит, возвращают HTTP 429 (Too Many Requests)
- **And** отображается toast уведомление "Слишком быстро! Максимум 10 тапов в секунду"
- **And** первые 10 запросов обрабатываются нормально

---

**US-014: Grace period для тапов**

*As a* выживший
*I want* чтобы мой тап засчитался, если я кликнул до конца раунда
*So that* технические задержки не лишают меня заслуженных очков

**Acceptance Criteria:**
- **Given** раунд активен с `endTime = T`
- **When** пользователь отправляет тап в момент времени `T - 0.5 секунды`
- **And** запрос обрабатывается сервером в момент `T + 0.3 секунды`
- **Then** тап засчитывается
- **And** очки начисляются корректно

**Implementation Note:** Использовать timestamp отправки запроса или мягкую границу `endTime + 1 секунда`.

---

### 5.4 Статистика и результаты

**US-015: Просмотр личного счета во время раунда**

*As a* выживший
*I want* видеть свой текущий счет во время раунда
*So that* я могу отслеживать свой прогресс

**Acceptance Criteria:**
- **Given** раунд активен
- **And** пользователь сделал несколько тапов
- **When** пользователь находится на странице раунда
- **Then** отображается "Мои очки: X"
- **And** счет обновляется после каждого тапа
- **And** НЕ отображается статистика других игроков

---

**US-016: Просмотр финальных результатов**

*As a* любой авторизованный пользователь
*I want* видеть результаты завершенного раунда
*So that* я могу узнать, кто победил и как я выступил

**Acceptance Criteria:**
- **Given** раунд завершен (статус Completed)
- **When** пользователь открывает страницу раунда
- **Then** отображается:
  - "Раунд завершен"
  - "Всего тапов: X"
  - "Всего очков: Y"
  - "Победитель: [Username] - [Points] очков"
  - "Мои очки: Z"
- **And** гусь не реагирует на клики

---

**US-017: Определение победителя**

*As a* система
*I want* корректно определять победителя раунда
*So that* результаты соревнования справедливы

**Acceptance Criteria:**
- **Given** раунд завершен
- **When** система рассчитывает победителя
- **Then** применяются следующие правила приоритета:
  1. Максимальное количество очков (`points`)
  2. При равенстве очков - минимальное количество тапов (`taps`)
  3. При полном равенстве - раньше созданная запись (`created_at`)
- **And** игроки с ролью `nikita` исключаются из расчета победителя

---

## 6. Техническая архитектура

### 6.1 Общая схема системы

```
┌─────────────────┐
│   React Client  │
│  (Vite + TS)    │
└────────┬────────┘
         │ HTTP/REST
         │ JWT in Header
         ▼
┌─────────────────┐
│  Reverse Proxy  │
│     (nginx)     │
└────────┬────────┘
         │ Load Balancing
    ┌────┴────┬────────┐
    ▼         ▼        ▼
┌────────┐ ┌────────┐ ┌────────┐
│ NestJS │ │ NestJS │ │ NestJS │
│ App #1 │ │ App #2 │ │ App #3 │
└───┬────┘ └───┬────┘ └───┬────┘
    │          │          │
    └──────────┴──────────┘
               │
               ▼
    ┌──────────────────┐
    │   PostgreSQL     │
    │  (Prisma ORM)    │
    └──────────────────┘
```

### 6.2 Backend архитектура (NestJS)

**Модульная структура:**

```
src/
├── main.ts                     # Entry point
├── app.module.ts               # Root module
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts      # POST /auth/login
│   ├── auth.service.ts         # Login/register logic
│   ├── jwt.strategy.ts         # JWT validation
│   └── guards/
│       ├── jwt-auth.guard.ts   # JWT guard
│       └── roles.guard.ts      # Role-based access
├── users/
│   ├── users.module.ts
│   ├── users.service.ts        # User CRUD operations
│   └── entities/
│       └── user.entity.ts      # Prisma model wrapper
├── rounds/
│   ├── rounds.module.ts
│   ├── rounds.controller.ts    # GET/POST /rounds, GET/POST /rounds/:id
│   ├── rounds.service.ts       # Round management logic
│   └── entities/
│       └── round.entity.ts
├── taps/
│   ├── taps.module.ts
│   ├── taps.controller.ts      # POST /rounds/:id/tap
│   ├── taps.service.ts         # Tap processing with transactions
│   └── guards/
│       └── rate-limit.guard.ts # Rate limiting
├── stats/
│   ├── stats.module.ts
│   ├── stats.service.ts        # Leaderboard calculations
│   └── entities/
│       └── round-stats.entity.ts
└── prisma/
    ├── prisma.module.ts
    ├── prisma.service.ts       # Prisma client wrapper
    └── schema.prisma           # Database schema
```

**Ключевые принципы:**

1. **Separation of Concerns:**
   - Controllers - маршрутизация и валидация запросов
   - Services - бизнес-логика
   - Repositories (Prisma) - доступ к данным

2. **Dependency Injection:**
   - NestJS DI контейнер для управления зависимостями
   - Singleton сервисы для эффективного использования ресурсов

3. **Middleware & Guards:**
   - JWT Guard для аутентификации
   - Roles Guard для авторизации
   - Rate Limit Guard для защиты от spam

4. **Transaction Management:**
   - Все операции тапа выполняются в транзакции Prisma
   - Изоляция уровня Read Committed или Serializable

### 6.3 Frontend архитектура (React)

**Структура проекта:**

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Root component with Router
├── pages/
│   ├── LoginPage.tsx           # /login
│   ├── RoundsListPage.tsx      # /rounds
│   └── RoundPage.tsx           # /rounds/:id
├── components/
│   ├── GooseImage.tsx          # Tappable goose component
│   ├── RoundCard.tsx           # Round list item
│   ├── Countdown.tsx           # Countdown timer
│   ├── Leaderboard.tsx         # Final results table
│   └── CreateRoundButton.tsx   # Admin-only button
├── hooks/
│   ├── useAuth.ts              # Authentication logic
│   ├── useRound.ts             # Round data fetching
│   ├── useTap.ts               # Tap handling
│   └── useCountdown.ts         # Client-side timer
├── services/
│   ├── api.ts                  # Axios instance with JWT interceptor
│   ├── auth.service.ts         # Login/register API calls
│   ├── rounds.service.ts       # Rounds API calls
│   └── taps.service.ts         # Tap API calls
├── context/
│   └── AuthContext.tsx         # Global auth state
├── types/
│   ├── user.types.ts
│   ├── round.types.ts
│   └── stats.types.ts
└── utils/
    ├── jwt.utils.ts            # JWT decode
    ├── time.utils.ts           # Time formatting
    └── toast.utils.ts          # Toast notifications
```

**Ключевые паттерны:**

1. **Component Composition:**
   - Мелкие переиспользуемые компоненты
   - Props drilling минимизирован через Context API

2. **Custom Hooks:**
   - Логика выделена в переиспользуемые хуки
   - Упрощенное тестирование

3. **API Layer:**
   - Централизованный API клиент (Axios)
   - Автоматическая подстановка JWT в заголовки
   - Error interceptor для toast уведомлений

4. **Client-Side Routing:**
   - React Router v6
   - Protected routes для авторизованных пользователей

### 6.4 UI библиотека и компоненты

**Выбор: shadcn/ui + Radix UI + Tailwind CSS**

**Обоснование выбора:**

1. **Минималистичный дизайн:**
   - shadcn/ui предоставляет ненавязчивые, стилистически нейтральные компоненты
   - Идеально подходит для игры с простым UI без сложных анимаций
   - Легко кастомизируется под требования проекта

2. **Copy-Paste архитектура:**
   - Компоненты копируются в проект, а не устанавливаются как npm пакет
   - Полный контроль над кодом компонентов
   - Нет скрытых зависимостей и лишнего кода
   - Итоговый bundle содержит только используемые компоненты

3. **TypeScript Support:**
   - Все компоненты написаны на TypeScript
   - Полная типизация из коробки
   - Соответствует требованию strict mode

4. **Встроенная поддержка Toast уведомлений:**
   - Интеграция с библиотекой **sonner** (~5kb)
   - Красивые, доступные toast уведомления
   - Минимальная конфигурация

5. **Легковесность:**
   - Только необходимые Radix UI primitives загружаются
   - Tailwind CSS обеспечивает минимальный CSS bundle
   - Общий размер UI библиотеки: ~15-20kb (gzipped)

6. **Доступность (A11y):**
   - Radix UI обеспечивает WCAG 2.1 AA compliance
   - Keyboard navigation из коробки
   - Screen reader friendly

**Установка и настройка:**

```bash
# 1. Инициализация shadcn/ui
npx shadcn-ui@latest init

# 2. Установка необходимых компонентов
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add form
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add dialog

# 3. Установка sonner для toast
npm install sonner
```

**Используемые компоненты:**

| Компонент | Применение | Radix Primitive |
|-----------|-----------|-----------------|
| Button | Кнопки на всех страницах | - |
| Input | Поля ввода на странице логина | - |
| Card | Карточки раундов в списке | - |
| Form | Форма логина, форма создания раунда | @radix-ui/react-form |
| Toast/Toaster | Уведомления об ошибках | sonner |
| Dialog | Модальное окно создания раунда (опционально) | @radix-ui/react-dialog |

**Структура UI компонентов:**

```
src/
├── components/
│   ├── ui/                    # shadcn/ui компоненты
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   └── toast.tsx
│   ├── GooseImage.tsx         # Кастомный компонент гуся
│   ├── RoundCard.tsx          # Карточка раунда (использует ui/card)
│   ├── Countdown.tsx          # Таймер обратного отсчета
│   └── CreateRoundButton.tsx  # Кнопка создания раунда
└── lib/
    └── utils.ts               # cn() helper для Tailwind
```

**Tailwind Configuration:**

```typescript
// tailwind.config.js
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#2196F3", // Синий акцент
          foreground: "#FFFFFF",
        },
        success: "#4CAF50",    // Зеленый (Active)
        warning: "#FFC107",    // Желтый (Cooldown)
        destructive: "#F44336", // Красный (Ошибки)
        muted: "#9E9E9E",      // Серый (Completed)
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

**Пример использования (Login Page):**

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export const LoginPage = () => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      toast.success("Вход выполнен успешно");
    } catch (error) {
      toast.error("Неверный пароль");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>ВОЙТИ</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Input placeholder="Имя пользователя" />
          <Input type="password" placeholder="Пароль" />
          <Button type="submit" className="w-full">Войти</Button>
        </form>
      </CardContent>
    </Card>
  );
};
```

**Альтернативы (рассмотренные, но отклоненные):**

| Библиотека | Причина отклонения |
|------------|-------------------|
| MUI (Material-UI) | Слишком тяжелая (~300kb), излишне сложная для простой игры |
| Ant Design | Специфичный китайский дизайн, большой bundle size (~500kb) |
| Chakra UI | Хороший вариант, но больше runtime overhead из-за CSS-in-JS |
| Mantine | Отличная библиотека, но более opinionated и тяжелая (~100kb) |
| Headless UI | Требует больше custom styling, нет готовых визуальных компонентов |

### 6.5 Stateless архитектура

**Требования:**

- НЕТ in-memory состояния, специфичного для пользователя
- НЕТ session affinity (пользователь может попасть на любой инстанс)
- Вся персистентная информация хранится в PostgreSQL
- Rate limiting может использовать Redis (общий для всех инстансов)

**Рекомендации:**

1. **Shared Cache (опционально):**
   - Redis для rate limiting
   - TTL-based ключи: `rate-limit:${userId}:${roundId}`

2. **Database as Source of Truth:**
   - Все критичные данные в PostgreSQL
   - Транзакции для консистентности

3. **Stateless Servers:**
   - JWT токены содержат всю необходимую информацию
   - Нет локальных сессий

---

## 7. API Спецификации

### 7.1 Аутентификация

#### POST /auth/login

**Описание:** Вход пользователя (создание нового или вход в существующий аккаунт)

**Request:**
```json
{
  "username": "string (min: 1, max: 50)",
  "password": "string (min: 8, max: 100)"
}
```

**Response (201 Created - новый пользователь):**
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

**Response (200 OK - существующий пользователь):**
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

**Error Response (401 Unauthorized - неверный пароль):**
```json
{
  "statusCode": 401,
  "message": "Неверный пароль",
  "error": "Unauthorized"
}
```

**Error Response (400 Bad Request - валидация):**
```json
{
  "statusCode": 400,
  "message": ["Пароль должен содержать минимум 8 символов"],
  "error": "Bad Request"
}
```

---

### 7.2 Раунды

#### GET /rounds

**Описание:** Получить список всех раундов

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
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

**Notes:**
- Раунды сортируются по статусу: active → cooldown → completed
- Внутри каждой группы - по времени старта (DESC)

---

#### POST /rounds

**Описание:** Создать новый раунд (только для администраторов)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request:**
```json
{
  "startTime": "2025-11-17T15:00:00.000Z"
}
```

**Response (201 Created):**
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

**Error Response (403 Forbidden - не админ):**
```json
{
  "statusCode": 403,
  "message": "Недостаточно прав. Требуется роль admin",
  "error": "Forbidden"
}
```

**Error Response (400 Bad Request - startTime в прошлом):**
```json
{
  "statusCode": 400,
  "message": "Время старта не может быть в прошлом",
  "error": "Bad Request"
}
```

---

#### GET /rounds/:id

**Описание:** Получить детальную информацию о раунде

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK - активный/cooldown раунд):**
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

**Response (200 OK - завершенный раунд):**
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

**Notes:**
- `myStats` = null если пользователь не участвовал в раунде
- `winner` = null если раунд еще не завершен

---

### 7.3 Тапы

#### POST /rounds/:id/tap

**Описание:** Зарегистрировать тап по гусю

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:** Пустой (может содержать timestamp для grace period)

**Response (200 OK):**
```json
{
  "taps": 26,
  "points": 28,
  "earnedPoints": 1,
  "isBonus": false
}
```

**Response (200 OK - бонусный тап):**
```json
{
  "taps": 33,
  "points": 50,
  "earnedPoints": 10,
  "isBonus": true
}
```

**Response (200 OK - Никита):**
```json
{
  "taps": 100,
  "points": 0,
  "earnedPoints": 0,
  "isBonus": false
}
```

**Error Response (400 Bad Request - раунд неактивен):**
```json
{
  "statusCode": 400,
  "message": "Раунд неактивен. Тапы принимаются только во время активного раунда",
  "error": "Bad Request"
}
```

**Error Response (404 Not Found - раунд не найден):**
```json
{
  "statusCode": 404,
  "message": "Раунд не найден",
  "error": "Not Found"
}
```

**Error Response (429 Too Many Requests - rate limit):**
```json
{
  "statusCode": 429,
  "message": "Слишком много запросов. Максимум 10 тапов в секунду",
  "error": "Too Many Requests"
}
```

---

## 8. Схема базы данных (Prisma)

### 8.1 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  SURVIVOR
  NIKITA
  ADMIN
}

enum RoundStatus {
  COOLDOWN
  ACTIVE
  COMPLETED
}

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

### 8.2 Миграции

**Создание начальной миграции:**
```bash
npx prisma migrate dev --name init
```

**Применение миграций в продакшене:**
```bash
npx prisma migrate deploy
```

### 8.3 Индексы и оптимизация

**Ключевые индексы:**

1. **users.username** - unique индекс для быстрого поиска по username
2. **rounds.status** - фильтрация раундов по статусу
3. **rounds.startTime** - сортировка раундов
4. **round_stats.roundId** - JOIN с таблицей rounds
5. **round_stats.userId** - JOIN с таблицей users
6. **round_stats.points** - сортировка для определения победителя
7. **round_stats.(roundId, userId)** - составной уникальный индекс для быстрого upsert

**Constraint'ы:**

- `users.username` - UNIQUE
- `round_stats.(roundId, userId)` - UNIQUE (игрок может иметь только одну запись статистики на раунд)
- Foreign keys с `ON DELETE CASCADE` для автоматического удаления связанных данных

---

## 9. Аутентификация и безопасность

### 9.1 JWT токены

**Структура токена:**

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "sub": "user-uuid",
  "username": "Иван",
  "role": "survivor",
  "iat": 1700000000,
  "exp": 1700086400
}
```

**Конфигурация:**

```bash
# .env
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=24h
```

**Передача токена:**

```http
GET /rounds HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 9.2 Хеширование паролей

**Библиотека:** bcrypt

**Конфигурация:**
```typescript
const SALT_ROUNDS = 10;
```

**Процесс:**

1. **Регистрация:**
   ```typescript
   const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
   // Сохранить passwordHash в БД
   ```

2. **Вход:**
   ```typescript
   const isMatch = await bcrypt.compare(password, user.passwordHash);
   if (!isMatch) throw new UnauthorizedException('Неверный пароль');
   ```

### 9.3 Валидация входных данных

**NestJS Pipes:**

```typescript
// auth.dto.ts
import { IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  username: string;

  @IsString()
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  @MaxLength(100)
  password: string;
}
```

**Использование:**
```typescript
@Post('login')
async login(@Body(ValidationPipe) loginDto: LoginDto) {
  // ...
}
```

### 9.4 Защита от атак

**1. SQL Injection:**
- Prisma ORM автоматически экранирует все параметры
- НЕ использовать raw SQL запросы без параметризации

**2. XSS (Cross-Site Scripting):**
- React автоматически экранирует вывод в JSX
- Избегать `dangerouslySetInnerHTML`

**3. CSRF (Cross-Site Request Forgery):**
- JWT в Authorization header (не в cookies) - иммунитет к CSRF
- Если используются cookies - добавить CSRF токены

**4. Rate Limiting:**
- Глобальный rate limit: 100 запросов в минуту на IP
- Tap endpoint: 10 тапов в секунду на пользователя

**5. CORS:**
```typescript
// main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
});
```

### 9.5 Авторизация (Role-Based Access Control)

**Roles Guard:**

```typescript
// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
```

**Использование:**

```typescript
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
createRound(@Body() createRoundDto: CreateRoundDto) {
  // Только админы могут создавать раунды
}
```

---

## 10. Требования к пользовательскому интерфейсу

### 10.1 Страница Login (`/login`)

**Макет:**

```
┌───────────────────────────────────────┐
│               ВОЙТИ                   │
├───────────────────────────────────────┤
│                                       │
│  Имя пользователя:                    │
│  ┌─────────────────────────────────┐  │
│  │                                 │  │
│  └─────────────────────────────────┘  │
│  Пароль:                              │
│  ┌─────────────────────────────────┐  │
│  │                                 │  │
│  └─────────────────────────────────┘  │
│                                       │
│  [Сообщение об ошибке]                │ <- красным, если есть
│                                       │
│  ┌─────────────────────────────────┐  │
│  │          Войти                  │  │
│  └─────────────────────────────────┘  │
│                                       │
└───────────────────────────────────────┘
```

**Функциональные требования:**

1. **Поля ввода:**
   - Username: текстовое поле, placeholder "Введите имя"
   - Password: поле типа password, placeholder "Введите пароль"

2. **Валидация:**
   - Client-side валидация минимальной длины пароля (8 символов)
   - Отображение ошибок под соответствующим полем

3. **Кнопка "Войти":**
   - Disabled во время отправки запроса
   - Показывает loading индикатор при обработке

4. **Сообщения об ошибках:**
   - "Неверный пароль" - красным под кнопкой
   - "Пароль должен содержать минимум 8 символов" - под полем пароля
   - Сетевые ошибки - toast уведомление

5. **Перенаправление:**
   - После успешного входа → `/rounds`
   - Сохранение JWT токена в localStorage или sessionStorage

**UX улучшения:**

- Автофокус на поле username при загрузке страницы
- Enter на поле password отправляет форму
- Автозаполнение браузера разрешено

---

### 10.2 Страница Список раундов (`/rounds`)

**Макет:**

```
┌─────────────────────────────────────────────────────┐
│         Список РАУНДОВ           Имя: admin         │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────┐                                │
│  │ Создать раунд   │  <- только для админа          │
│  └─────────────────┘                                │
│                                                     │
│  ┌─────────────────────────────────────────────────┐│
│  │  ● Round ID: 8c3eed83-8a8a-41a0-8f91-...       ││ <- кликабельная ссылка
│  │                                                 ││
│  │  Start: 17.11.2025, 15:00:00                    ││
│  │  End:   17.11.2025, 15:01:00                    ││
│  │                                                 ││
│  │  ───────────────────────────────────────────    ││
│  │  Статус: Активен                                ││ <- зеленым
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  ┌─────────────────────────────────────────────────┐│
│  │  ● Round ID: 7b2ffc72-9b9b-52b1-9e02-...       ││
│  │                                                 ││
│  │  Start: 17.11.2025, 16:00:00                    ││
│  │  End:   17.11.2025, 16:01:00                    ││
│  │                                                 ││
│  │  ───────────────────────────────────────────────││
│  │  Статус: Cooldown (через 00:45)                ││ <- желтым
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  ┌─────────────────────────────────────────────────┐│
│  │  ● Round ID: 6a1eeb61-8a8a-41a0-7d01-...       ││
│  │                                                 ││
│  │  Start: 17.11.2025, 14:00:00                    ││
│  │  End:   17.11.2025, 14:01:00                    ││
│  │                                                 ││
│  │  ───────────────────────────────────────────────││
│  │  Статус: Завершен                               ││ <- серым
│  └─────────────────────────────────────────────────┘│
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Функциональные требования:**

1. **Шапка:**
   - Заголовок "Список РАУНДОВ"
   - Username текущего пользователя в правом верхнем углу

2. **Кнопка "Создать раунд":**
   - Отображается только для пользователей с ролью `admin`
   - При клике открывает модальное окно или форму
   - Поля формы:
     - Время старта (datetime-local input)
     - Кнопка "Создать"
   - После создания → автоматический редирект на `/rounds/:id`

3. **Список раундов:**
   - Группировка по статусам: Active → Cooldown → Completed
   - Внутри группы сортировка по времени старта (новые сверху)
   - Каждая карточка раунда содержит:
     - Round ID (полный UUID или сокращенный, кликабельный)
     - Время старта (формат: DD.MM.YYYY, HH:MM:SS)
     - Время окончания
     - Статус (цветовая индикация)
   - Клик на карточку → переход на `/rounds/:id`

4. **Цветовая индикация статусов:**
   - Active: зеленый (#4CAF50)
   - Cooldown: желтый (#FFC107)
   - Completed: серый (#9E9E9E)

5. **Автообновление:**
   - Polling каждые 5 секунд для обновления списка раундов
   - Плавное обновление без "мигания" интерфейса

**UX улучшения:**

- Loading skeleton при первой загрузке
- Кнопка "Обновить" для ручного обновления списка
- Пустое состояние: "Раундов пока нет. Создайте первый!" (для админа)

---

### 10.3 Страница раунда (`/rounds/:id`)

**10.3.1 Состояние: Cooldown**

```
┌───────────────────────────────────────┐
│            Cooldown      Имя: Иван    │
├───────────────────────────────────────┤
│                                       │
│            ░░░░░░░░░░░░░░░            │
│          ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░           │
│        ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░         │
│        ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░         │
│      ░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░       │
│    ░░▒▒▒▒░░░░▓▓▓▓▓▓▓▓▓▓▓▓░░░░▒▒▒▒░░   │
│    ░░▒▒▒▒▒▒▒▒░░░░░░░░░░░░▒▒▒▒▒▒▒▒░░   │
│    ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░   │
│      ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░     │
│        ░░░░░░░░░░░░░░░░░░░░░░░░░░     │
│                                       │
│              Cooldown                 │
│        До начала раунда: 00:45        │ <- обновляется каждую секунду
│                                       │
└───────────────────────────────────────┘
```

**Функциональность:**

- Гусь отображается, но неактивен (cursor: default)
- Таймер обратного отсчета обновляется каждую секунду
- При достижении 00:00 автоматически переключается на состояние Active
- Кнопка "Назад к списку раундов"

---

**10.3.2 Состояние: Active**

```
┌───────────────────────────────────────┐
│           Раунд активен!   Имя: Иван  │
├───────────────────────────────────────┤
│                                       │
│            ░░░░░░░░░░░░░░░            │
│          ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░           │
│        ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░         │
│        ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░         │
│      ░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░       │ <- кликабельный (cursor: pointer)
│    ░░▒▒▒▒░░░░▓▓▓▓▓▓▓▓▓▓▓▓░░░░▒▒▒▒░░   │
│    ░░▒▒▒▒▒▒▒▒░░░░░░░░░░░░▒▒▒▒▒▒▒▒░░   │
│    ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░   │
│      ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░     │
│        ░░░░░░░░░░░░░░░░░░░░░░░░░░     │
│                                       │
│            Раунд активен!             │
│        До конца осталось: 00:47       │ <- обновляется каждую секунду
│            Мои очки: 123              │ <- обновляется после каждого тапа
│                                       │
└───────────────────────────────────────┘
```

**Функциональность:**

1. **Интерактивный гусь:**
   - Cursor: pointer при наведении
   - Клик отправляет POST /rounds/:id/tap
   - НЕТ визуальной анимации (только обновление счета)
   - Debounce НЕ применяется (можно тапать максимально быстро)

2. **Счетчик очков:**
   - Обновляется мгновенно после получения ответа от сервера
   - Анимация изменения числа (опционально)
   - Показывает +1 или +10 при бонусе (опционально, fade-out анимация)

3. **Таймер:**
   - Обновляется каждую секунду
   - Источник истины: `endTime` от сервера
   - Расчет на клиенте: `Math.max(0, endTime - Date.now())`
   - При достижении 00:00 → переключение на состояние Completed

4. **Обработка ошибок:**
   - 400 Bad Request (раунд неактивен) → toast "Раунд завершен"
   - 429 Too Many Requests → toast "Слишком быстро! Максимум 10 тапов/сек"
   - 500 Server Error → toast "Ошибка сервера, попробуйте позже"

**UX улучшения:**

- Оптимистичные обновления: увеличивать счетчик локально до получения ответа
- Rollback при ошибке
- Визуальный feedback при клике (легкая вибрация на мобильных, опционально)

---

**10.3.3 Состояние: Completed**

```
┌───────────────────────────────────────┐
│       Раунд завершен       Имя: Иван  │
├───────────────────────────────────────┤
│                                       │
│            ░░░░░░░░░░░░░░░            │
│          ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░           │
│        ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░         │
│        ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░         │
│      ░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░       │
│    ░░▒▒▒▒░░░░▓▓▓▓▓▓▓▓▓▓▓▓░░░░▒▒▒▒░░   │
│    ░░▒▒▒▒▒▒▒▒░░░░░░░░░░░░▒▒▒▒▒▒▒▒░░   │
│    ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░   │
│      ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░     │
│        ░░░░░░░░░░░░░░░░░░░░░░░░░░     │
│                                       │
│  ─────────────────────────────────    │
│  Всего тапов:        999              │
│  Всего очков:        1234             │
│  Победитель: Иван    105 очков        │ <- жирным шрифтом
│  Мои очки:           98               │
│                                       │
│  ┌─────────────────────────────────┐  │
│  │      Вернуться к раундам        │  │
│  └─────────────────────────────────┘  │
│                                       │
└───────────────────────────────────────┘
```

**Функциональность:**

1. **Финальная статистика:**
   - Всего тапов в раунде
   - Всего очков в раунде
   - Победитель с количеством очков
   - Личная статистика игрока

2. **Гусь:**
   - Неактивен (cursor: default)
   - Клики игнорируются

3. **Кнопка "Вернуться к раундам":**
   - Переход на `/rounds`

**UX улучшения:**

- Конфетти анимация, если текущий пользователь - победитель
- Топ-3 игрока (опционально, расширенный лидерборд)
- Возможность поделиться результатом (опционально)

---

### 10.4 Общие UI требования

**1. Адаптивность:**
- Поддержка desktop (1280px+) и mobile (320px+)
- Breakpoints: 320px, 768px, 1024px, 1280px

**2. Шрифты:**
- Основной текст: 16px, line-height: 1.5
- Заголовки: 24px (h1), 20px (h2)
- Моноширинный шрифт для UUID (опционально)

**3. Цветовая палитра:**
- Фон: #FFFFFF (светлая тема) или #1E1E1E (темная тема)
- Текст: #212121 / #E0E0E0
- Акцент: #2196F3 (синий)
- Успех: #4CAF50 (зеленый)
- Предупреждение: #FFC107 (желтый)
- Ошибка: #F44336 (красный)
- Серый: #9E9E9E

**4. Toast уведомления:**
- Библиотека: **sonner** (легковесная, красивая, с отличной TypeScript поддержкой)
- Позиция: top-right
- Автозакрытие: 3 секунды
- Типы: success, error, warning, info
- Интеграция: `<Toaster />` компонент в корневом App.tsx

**5. Loading состояния:**
- Skeleton screens для списков
- Spinner для кнопок
- Progress bar для длительных операций

**6. Доступность (A11y):**
- ARIA labels для интерактивных элементов
- Keyboard navigation (Tab, Enter)
- Focus indicators
- WCAG 2.1 AA compliance (опционально, но рекомендовано)

---

## 11. Стратегия обновлений в реальном времени

### 11.1 Подходы к real-time updates

**Вариант 1: Polling (рекомендовано для MVP)**

**Преимущества:**
- Простота реализации
- Не требует WebSocket инфраструктуры
- Совместимость со всеми браузерами
- Легко масштабируется (stateless)

**Недостатки:**
- Задержка обновлений (зависит от интервала polling)
- Дополнительная нагрузка на сервер (даже если данных нет)

**Реализация:**

```typescript
// useRoundPolling.ts
export const useRoundPolling = (roundId: string, interval = 2000) => {
  const [roundData, setRoundData] = useState(null);

  useEffect(() => {
    const fetchRound = async () => {
      const data = await api.get(`/rounds/${roundId}`);
      setRoundData(data);
    };

    fetchRound(); // Первоначальная загрузка
    const timer = setInterval(fetchRound, interval);

    return () => clearInterval(timer);
  }, [roundId, interval]);

  return roundData;
};
```

**Интервалы polling:**
- Список раундов: 5 секунд
- Активный раунд (статистика): 2 секунды
- Cooldown раунд: 5 секунд
- Завершенный раунд: polling отключен

---

**Вариант 2: WebSocket (для будущих улучшений)**

**Преимущества:**
- Мгновенные обновления
- Меньше нагрузки (push вместо pull)
- Лучший UX

**Недостатки:**
- Сложность реализации
- Требует sticky sessions или Redis adapter
- Проблемы с некоторыми proxy/firewall

**Реализация (концепт):**

```typescript
// Backend (NestJS Gateway)
@WebSocketGateway({ cors: true })
export class RoundsGateway {
  @WebSocketServer()
  server: Server;

  emitRoundUpdate(roundId: string, data: any) {
    this.server.to(`round:${roundId}`).emit('roundUpdate', data);
  }
}

// Frontend
const socket = io('ws://localhost:3000');
socket.emit('joinRound', roundId);
socket.on('roundUpdate', (data) => {
  setRoundData(data);
});
```

---

### 11.2 Client-side таймеры

**Требование:** Обратный отсчет должен обновляться каждую секунду без запросов к серверу.

**Реализация:**

```typescript
// useCountdown.ts
export const useCountdown = (targetTime: string) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = new Date(targetTime).getTime() - Date.now();
      setTimeLeft(Math.max(0, diff));
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetTime]);

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};
```

**Использование:**

```tsx
const Round = ({ round }) => {
  const countdown = useCountdown(round.endTime);

  return <div>До конца: {countdown}</div>;
};
```

---

### 11.3 Оптимистичные обновления

**Концепция:** Обновлять UI немедленно, до получения ответа от сервера.

**Реализация тапа:**

```typescript
const handleTap = async () => {
  // 1. Оптимистичное обновление
  setMyPoints((prev) => prev + 1);

  try {
    // 2. Запрос к серверу
    const response = await api.post(`/rounds/${roundId}/tap`);

    // 3. Обновление до серверных данных
    setMyPoints(response.points);
  } catch (error) {
    // 4. Rollback при ошибке
    setMyPoints((prev) => prev - 1);
    toast.error('Ошибка при тапе');
  }
};
```

**Преимущества:**
- Мгновенный UI feedback
- Лучшее восприятие отзывчивости

**Ограничения:**
- Требует rollback логики
- Может показывать некорректные данные при ошибках сети

---

## 12. Требования к производительности

### 12.1 Backend производительность

**Целевые метрики:**

| Endpoint | P50 Latency | P95 Latency | P99 Latency | Throughput |
|----------|-------------|-------------|-------------|------------|
| POST /auth/login | < 200ms | < 400ms | < 600ms | 100 req/s |
| GET /rounds | < 50ms | < 100ms | < 150ms | 500 req/s |
| GET /rounds/:id | < 50ms | < 100ms | < 150ms | 1000 req/s |
| POST /rounds/:id/tap | < 50ms | < 100ms | < 200ms | 1000 req/s |

**Оптимизации:**

1. **Database:**
   - Индексы на всех foreign keys
   - Connection pooling (Prisma default: 10 connections)
   - Query optimization (N+1 проблемы)

2. **Caching:**
   - Redis для rate limiting
   - In-memory cache для списка раундов (TTL: 5 секунд)

3. **Transaction optimization:**
   - Минимальная scope транзакции
   - Использование `READ COMMITTED` вместо `SERIALIZABLE` (если возможно)

---

### 12.2 Frontend производительность

**Целевые метрики:**

| Метрика | Значение |
|---------|----------|
| First Contentful Paint (FCP) | < 1.5s |
| Largest Contentful Paint (LCP) | < 2.5s |
| Time to Interactive (TTI) | < 3.5s |
| Total Bundle Size | < 500KB (gzipped) |

**Оптимизации:**

1. **Code Splitting:**
   - Lazy loading страниц (React.lazy)
   - Dynamic imports для тяжелых библиотек

2. **Asset Optimization:**
   - Изображение гуся: WebP формат, < 50KB
   - SVG для иконок
   - Minification и tree-shaking (Vite default)

3. **Rendering:**
   - React.memo для компонентов списков
   - useMemo/useCallback для дорогих вычислений
   - Virtual scrolling для длинных списков (опционально)

---

### 12.3 Тестирование производительности

**Инструменты:**

1. **Backend:**
   - k6 или Artillery для load testing
   - Сценарий: 100 пользователей, 1000 тапов в минуту

2. **Frontend:**
   - Lighthouse CI
   - Chrome DevTools Performance tab

**Пример k6 теста:**

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 100 },
    { duration: '1m', target: 0 },
  ],
};

export default function () {
  const loginRes = http.post('http://localhost:3000/auth/login', {
    username: 'test',
    password: 'password123',
  });

  const token = loginRes.json('accessToken');

  const tapRes = http.post(
    'http://localhost:3000/rounds/uuid/tap',
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  check(tapRes, {
    'tap status is 200': (r) => r.status === 200,
    'tap latency < 100ms': (r) => r.timings.duration < 100,
  });

  sleep(1);
}
```

---

## 13. Метрики успеха

### 13.1 Технические метрики

**1. Производительность:**
- 95% запросов тапа обрабатываются < 100ms
- Uptime > 99.5%
- Отсутствие race conditions (проверено нагрузочными тестами)

**2. Масштабируемость:**
- Успешная работа с 3+ инстансами бекенда
- Линейный рост производительности при добавлении инстансов
- Отсутствие bottleneck на уровне БД при < 1000 concurrent users

**3. Безопасность:**
- 0 SQL injection уязвимостей (SonarQube/SAST)
- Все пароли хешированы (bcrypt)
- JWT токены защищены и валидируются

---

### 13.2 Пользовательские метрики

**1. Вовлеченность:**
- Среднее количество тапов на раунд на игрока: > 20
- Процент пользователей, завершивших раунд: > 80%
- Repeat rate (участие в 2+ раундах): > 50%

**2. UX:**
- Time to First Tap (от входа до первого тапа): < 30 секунд
- Bounce rate на странице раунда: < 10%
- Отсутствие критических UI багов

**3. Надежность:**
- Процент успешных тапов: > 99%
- Отсутствие потери данных (все тапы засчитаны корректно)

---

### 13.3 Бизнес-метрики (для реального продукта)

- Daily Active Users (DAU)
- Retention rate (Day 1, Day 7, Day 30)
- Average session duration
- Virality coefficient (приглашенных друзей на пользователя)

---

## 14. Вне области проекта (Out of Scope)

Следующие функции НЕ входят в текущую версию продукта:

### 14.1 Функциональность

- Регистрация через email/социальные сети
- Восстановление пароля
- Профиль пользователя с историей игр
- Глобальный лидерборд (все раунды)
- Система достижений/badges
- Внутриигровая валюта/магазин
- Кастомизация гуся
- Звуковые эффекты
- Мультиплеерный чат
- Приватные раунды (только по приглашению)
- Турнирный режим с плей-офф
- Мобильное приложение (native)

### 14.2 Технические возможности

- WebSocket real-time обновления
- Server-Side Rendering (SSR)
- Progressive Web App (PWA)
- Офлайн режим
- Push notifications
- Аналитика (Google Analytics, Mixpanel)
- A/B тестирование фич
- Feature flags система
- Мультиязычность (i18n)
- Темная/светлая тема (если не реализована)
- Экспорт статистики в CSV/PDF

### 14.3 Инфраструктура

- CI/CD pipeline
- Docker Compose для развертывания
- Kubernetes orchestration
- Monitoring (Prometheus, Grafana)
- Centralized logging (ELK stack)
- CDN для статических ресурсов
- Geo-distributed deployment
- Disaster recovery план

---

## 15. Будущие улучшения

### 15.1 Phase 2 (краткосрочная перспектива)

**1. WebSocket интеграция:**
- Мгновенные обновления статистики
- Real-time лидерборд во время раунда (опционально)

**2. Расширенная статистика:**
- Топ-10 игроков раунда
- График активности тапов по времени
- Персональная история участий

**3. Социальные функции:**
- Приглашение друзей по ссылке
- Sharing результатов в соцсетях

**4. UX улучшения:**
- Звуковые эффекты для тапов
- Визуальные анимации (конфетти для победителя)
- Темная тема

---

### 15.2 Phase 3 (долгосрочная перспектива)

**1. Gamification:**
- Система уровней игрока (XP)
- Достижения (badges)
- Ежедневные челленджи

**2. Расширенные игровые режимы:**
- Team-based раунды (команды)
- Турнирный режим с плей-офф
- Ranked matches с рейтингом ELO

**3. Монетизация:**
- Косметические улучшения гуся
- Premium аккаунты (статистика, приоритетный доступ)
- Реклама (не мешающая геймплею)

**4. Платформа расширение:**
- Мобильное приложение (React Native)
- API для сторонних интеграций
- Webhook система для событий

---

### 15.3 Технический долг и рефакторинг

**Планируемые улучшения архитектуры:**

1. **Microservices разделение:**
   - Auth service
   - Rounds service
   - Stats service
   - Gateway API

2. **Event-Driven Architecture:**
   - Message queue (RabbitMQ/Kafka)
   - Event sourcing для статистики
   - CQRS паттерн

3. **Advanced Caching:**
   - Redis для frequently accessed данных
   - Cache invalidation стратегия
   - CDN для статических ресурсов

4. **Observability:**
   - Distributed tracing (Jaeger)
   - Metrics collection (Prometheus)
   - Dashboards (Grafana)

---

## 16. Приложения

### 16.1 Глоссарий терминов

| Термин | Определение |
|--------|-------------|
| **Гусь (Goose)** | Виртуальный персонаж, по которому игроки тапают |
| **Тап (Tap)** | Клик по изображению гуся, регистрирующий очко |
| **Раунд (Round)** | Игровая сессия с фиксированным временем начала и конца |
| **Cooldown** | Период ожидания перед началом раунда |
| **Survivor** | Обычный игрок с полными правами участия |
| **Nikita** | Специальная роль с фантомными тапами (0 очков) |
| **Admin** | Администратор, создающий раунды |
| **Grace Period** | Период после окончания раунда, когда тапы еще принимаются |
| **Race Condition** | Ситуация конкурентного доступа к данным |
| **Stateless** | Архитектура без серверного состояния между запросами |

---

### 16.2 Примеры API запросов/ответов

**Пример 1: Успешный тап с бонусом**

Request:
```http
POST /rounds/550e8400-e29b-41d4-a716-446655440000/tap HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

Response:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "taps": 11,
  "points": 20,
  "earnedPoints": 10,
  "isBonus": true
}
```

---

**Пример 2: Создание раунда администратором**

Request:
```http
POST /rounds HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "startTime": "2025-11-17T16:00:00.000Z"
}
```

Response:
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "660e9510-f39c-52e5-b827-557766551111",
  "startTime": "2025-11-17T16:00:00.000Z",
  "endTime": "2025-11-17T16:01:00.000Z",
  "status": "cooldown",
  "totalTaps": 0,
  "totalPoints": 0,
  "createdAt": "2025-11-17T15:58:30.000Z"
}
```

---

### 16.3 Environment Variables Reference

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/goose_game"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRATION="24h"

# Game Configuration
ROUND_DURATION=60           # Длительность раунда в секундах
COOLDOWN_DURATION=30        # Длительность cooldown в секундах

# Server
PORT=3000
NODE_ENV="development"      # development | production | test

# CORS
FRONTEND_URL="http://localhost:5173"

# Rate Limiting
RATE_LIMIT_TAPS_PER_SECOND=10
RATE_LIMIT_GLOBAL_PER_MINUTE=100

# Redis (опционально, для rate limiting)
REDIS_URL="redis://localhost:6379"

# Logging
LOG_LEVEL="info"            # error | warn | info | debug
```

---

### 16.4 Диаграммы

**16.4.1 Диаграмма состояний раунда**

```
       ┌──────────────┐
       │   Создание   │
       └──────┬───────┘
              │
              ▼
       ┌──────────────┐
       │   COOLDOWN   │
       │              │
       │  currentTime │
       │  < startTime │
       └──────┬───────┘
              │
              │ startTime достигнуто
              ▼
       ┌──────────────┐
       │    ACTIVE    │
       │              │
       │  startTime ≤ │
       │  currentTime │
       │  < endTime   │
       └──────┬───────┘
              │
              │ endTime достигнуто
              ▼
       ┌──────────────┐
       │  COMPLETED   │
       │              │
       │  currentTime │
       │  ≥ endTime   │
       └──────────────┘
```

---

**16.4.2 Sequence диаграмма: Обработка тапа**

```
Client          API Gateway       Auth Guard      Taps Service      Database
  │                 │                 │                 │                │
  │─POST /tap──────>│                 │                 │                │
  │                 │                 │                 │                │
  │                 │──Validate JWT──>│                 │                │
  │                 │<───User Info────│                 │                │
  │                 │                 │                 │                │
  │                 │─────Process Tap─────────────────>│                │
  │                 │                 │                 │                │
  │                 │                 │                 │──BEGIN TX─────>│
  │                 │                 │                 │                │
  │                 │                 │                 │──Check Round───>│
  │                 │                 │                 │<───Active───────│
  │                 │                 │                 │                │
  │                 │                 │                 │──Upsert Stats──>│
  │                 │                 │                 │<───Stats────────│
  │                 │                 │                 │                │
  │                 │                 │                 │──Update Points─>│
  │                 │                 │                 │<───Updated──────│
  │                 │                 │                 │                │
  │                 │                 │                 │──COMMIT TX─────>│
  │                 │                 │                 │<───Success──────│
  │                 │                 │                 │                │
  │                 │<────────Response (taps, points)───│                │
  │                 │                 │                 │                │
  │<─200 OK─────────│                 │                 │                │
  │  {taps: 26}     │                 │                 │                │
```

---

## 17. Контрольный чеклист для разработки

### 17.1 Backend

- [ ] Настроена PostgreSQL база данных
- [ ] Создана Prisma схема с моделями User, Round, RoundStats
- [ ] Применены миграции БД
- [ ] Реализован JWT authentication
- [ ] Реализовано bcrypt хеширование паролей
- [ ] Endpoint POST /auth/login (с автосозданием пользователя)
- [ ] Endpoint GET /rounds (список раундов)
- [ ] Endpoint POST /rounds (создание раунда, admin only)
- [ ] Endpoint GET /rounds/:id (детали раунда)
- [ ] Endpoint POST /rounds/:id/tap (обработка тапа)
- [ ] Транзакционная логика для тапа (race conditions protected)
- [ ] Роли назначаются автоматически по username
- [ ] Логика бонуса за 11-й тап (глобальный счетчик)
- [ ] Фантомные тапы для роли Nikita (0 очков)
- [ ] Rate limiting (10 тапов/сек на пользователя)
- [ ] Grace period для тапов
- [ ] Валидация входных данных (class-validator)
- [ ] Error handling и корректные HTTP коды
- [ ] TypeScript strict mode включен
- [ ] CORS настроен
- [ ] Environment variables (.env файл)
- [ ] Unit тесты для критичной логики
- [ ] Integration тесты для API
- [ ] Load тесты (k6/Artillery)

---

### 17.2 Frontend

- [ ] Настроен Vite + React + TypeScript
- [ ] Настроен React Router
- [ ] Создана страница /login
- [ ] Создана страница /rounds (список раундов)
- [ ] Создана страница /rounds/:id (раунд)
- [ ] Axios instance с JWT interceptor
- [ ] Context/Provider для аутентификации
- [ ] Protected routes для авторизованных пользователей
- [ ] Форма логина с валидацией
- [ ] Отображение ошибок под полями и в toast
- [ ] Список раундов с группировкой по статусам
- [ ] Кнопка "Создать раунд" (только для админа)
- [ ] Интерактивный гусь (клик отправляет тап)
- [ ] Client-side таймер (обновление каждую секунду)
- [ ] Отображение личного счета (обновление после тапа)
- [ ] Финальная статистика для завершенных раундов
- [ ] Toast уведомления для ошибок
- [ ] Оптимистичные обновления для тапов
- [ ] Polling для обновления статистики раунда
- [ ] Loading состояния (skeleton, spinner)
- [ ] Адаптивная верстка (mobile + desktop)
- [ ] Доступность (keyboard navigation, ARIA)
- [ ] Performance optimization (code splitting, мемоизация)
- [ ] E2E тесты (Playwright/Cypress) - опционально

---

### 17.3 DevOps (опционально)

- [ ] Dockerfile для бекенда
- [ ] Dockerfile для фронтенда
- [ ] Docker Compose для локальной разработки
- [ ] CI/CD pipeline (GitHub Actions/GitLab CI)
- [ ] Миграции применяются автоматически при деплое
- [ ] Health check endpoint (/health)
- [ ] Logging настроен (Winston/Pino)
- [ ] Monitoring (Prometheus metrics)

---

## 18. Заключение

Данный PRD предоставляет полное техническое и функциональное описание проекта "The Last of Guss". Документ охватывает все аспекты разработки: от бизнес-требований до технических деталей реализации.

**Ключевые принципы проекта:**

1. **Консистентность данных:** Все критичные операции выполняются в транзакциях БД
2. **Масштабируемость:** Stateless архитектура для поддержки множественных инстансов
3. **Простота:** REST API вместо WebSocket для упрощения MVP
4. **Качество кода:** SOLID, TypeScript strict mode, тестирование
5. **UX фокус:** Оптимистичные обновления, мгновенный feedback, понятные ошибки

**Следующие шаги:**

1. Ознакомить команду с PRD
2. Провести Technical Design Review
3. Создать tasks в системе управления проектами (JIRA/Linear)
4. Начать разработку с backend (базовая инфраструктура → auth → rounds → taps)
5. Параллельно разработать frontend (login → rounds list → round page)
6. Провести тестирование и code review
7. Развернуть в staging окружении
8. Нагрузочное тестирование
9. Production deployment

**Контакты для вопросов:**

- Product Owner: [ТБД]
- Tech Lead: [ТБД]
- Backend Lead: [ТБД]
- Frontend Lead: [ТБД]

---

**Приложение: История изменений документа**

| Версия | Дата | Автор | Изменения |
|--------|------|-------|-----------|
| 1.0 | 2025-11-17 | Product Team | Первая версия PRD |

---

*Конец документа*
