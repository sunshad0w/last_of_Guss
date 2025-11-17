#!/bin/bash

# Скрипт запуска через Docker Compose для "The Last of Guss"
# Использование: ./start-docker.sh

set -e

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  The Last of Guss - Docker Launcher   ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Ошибка: Docker не установлен!${NC}"
    echo -e "${YELLOW}Установите Docker: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi

# Проверка наличия Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Ошибка: Docker Compose не установлен!${NC}"
    echo -e "${YELLOW}Установите Docker Compose: https://docs.docker.com/compose/install/${NC}"
    exit 1
fi

# Проверка наличия docker-compose.yml
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Ошибка: Файл docker-compose.yml не найден!${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Сборка и запуск контейнеров...${NC}"
echo ""

# Определяем команду для docker compose
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# Останавливаем и удаляем старые контейнеры (если есть)
echo -e "${YELLOW}🛑 Остановка и удаление старых контейнеров...${NC}"
$COMPOSE_CMD down --remove-orphans 2>/dev/null || true

# Удаляем отдельные контейнеры goose, если они есть
docker rm -f goose-postgres goose-backend1 goose-backend2 goose-backend3 goose-nginx 2>/dev/null || true
echo ""

# Собираем образы
echo -e "${YELLOW}🔨 Сборка Docker образов...${NC}"
$COMPOSE_CMD build --no-cache
echo ""

# Запускаем контейнеры
echo -e "${YELLOW}🚀 Запуск сервисов...${NC}"
$COMPOSE_CMD up -d
echo ""

# Ждем пока контейнеры запустятся
echo -e "${YELLOW}⏳ Ожидание запуска сервисов...${NC}"
sleep 5
echo ""

# Проверяем статус контейнеров
echo -e "${BLUE}📊 Статус контейнеров:${NC}"
$COMPOSE_CMD ps
echo ""

# Проверяем health check
echo -e "${BLUE}🏥 Проверка здоровья сервисов...${NC}"
sleep 10

HEALTH_CHECK_PASSED=true

# Проверяем PostgreSQL
if docker exec goose-postgres pg_isready -U goose_user -d goose_game &>/dev/null; then
    echo -e "${GREEN}✓ PostgreSQL - работает${NC}"
else
    echo -e "${RED}✗ PostgreSQL - не отвечает${NC}"
    HEALTH_CHECK_PASSED=false
fi

# Проверяем backend через NGINX
if curl -sf http://localhost/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend (через NGINX) - работает${NC}"
else
    echo -e "${RED}✗ Backend - не отвечает${NC}"
    HEALTH_CHECK_PASSED=false
fi

# Проверяем NGINX
if curl -sf http://localhost/nginx-status > /dev/null 2>&1; then
    echo -e "${GREEN}✓ NGINX - работает${NC}"
else
    echo -e "${YELLOW}⚠ NGINX status - недоступен (это нормально, если ограничен доступ)${NC}"
fi

echo ""

if [ "$HEALTH_CHECK_PASSED" = true ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  ✓ Все сервисы успешно запущены!     ${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}📍 Доступные endpoints:${NC}"
    echo -e "  ${YELLOW}API:${NC}           http://localhost/api"
    echo -e "  ${YELLOW}Health Check:${NC}  http://localhost/health"
    echo -e "  ${YELLOW}NGINX Status:${NC}  http://localhost/nginx-status"
    echo ""
    echo -e "${BLUE}🏗️ Архитектура:${NC}"
    echo -e "  ${YELLOW}NGINX${NC} (порт 80) → балансирует между:"
    echo -e "    ├─ Backend 1"
    echo -e "    ├─ Backend 2"
    echo -e "    └─ Backend 3"
    echo -e "  ${YELLOW}PostgreSQL${NC} (порт 5432)"
    echo ""
    echo -e "${BLUE}📝 Полезные команды:${NC}"
    echo -e "  Логи всех сервисов:    ${YELLOW}docker-compose logs -f${NC}"
    echo -e "  Логи конкретного:      ${YELLOW}docker-compose logs -f backend1${NC}"
    echo -e "  Остановить:            ${YELLOW}docker-compose down${NC}"
    echo -e "  Пересобрать:           ${YELLOW}docker-compose up -d --build${NC}"
    echo -e "  Статус:                ${YELLOW}docker-compose ps${NC}"
    echo ""
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}  ⚠ Некоторые сервисы не запустились  ${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Проверьте логи:${NC} docker-compose logs"
    echo ""
fi

echo -e "${YELLOW}Для остановки нажмите: ${NC}./stop-docker.sh"
echo -e "${YELLOW}Для просмотра логов:   ${NC}docker-compose logs -f"
echo ""
