#!/bin/bash

# Скрипт остановки Docker Compose для "The Last of Guss"
# Использование: ./stop-docker.sh

set -e

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Остановка Docker контейнеров...     ${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Определяем команду для docker compose
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# Показываем работающие контейнеры
echo -e "${YELLOW}📊 Работающие контейнеры:${NC}"
$COMPOSE_CMD ps
echo ""

# Останавливаем контейнеры
echo -e "${YELLOW}🛑 Остановка контейнеров...${NC}"
$COMPOSE_CMD down

echo ""
echo -e "${GREEN}✓ Все контейнеры остановлены${NC}"
echo ""
echo -e "${YELLOW}Примечание:${NC} Данные PostgreSQL сохранены в volume 'goose-postgres-data'"
echo -e "${YELLOW}Для полной очистки (включая БД):${NC} docker-compose down -v"
echo ""
