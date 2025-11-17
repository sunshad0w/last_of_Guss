#!/bin/bash

# Скрипт запуска Frontend для "The Last of Guss"
# Использование: ./start-frontend.sh

set -e

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN} The Last of Guss - Frontend Launcher  ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Путь к директории frontend
FRONTEND_DIR="/Users/sunshad0w/Work/tests/goose/frontend"

# Проверка существования директории
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}Ошибка: Директория frontend не найдена!${NC}"
    echo -e "${RED}Ожидаемый путь: $FRONTEND_DIR${NC}"
    exit 1
fi

# Переход в директорию frontend
cd "$FRONTEND_DIR"
echo -e "${YELLOW}Рабочая директория: $(pwd)${NC}"
echo ""

# Проверка наличия .env файла
if [ ! -f ".env" ]; then
    echo -e "${RED}Ошибка: Файл .env не найден!${NC}"
    echo -e "${YELLOW}Создайте файл .env на основе .env.example:${NC}"
    echo -e "${YELLOW}  cp .env.example .env${NC}"
    echo -e "${YELLOW}  # Затем отредактируйте .env с вашими настройками${NC}"
    exit 1
fi

# Проверка наличия node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}node_modules не найдена. Устанавливаем зависимости...${NC}"
    npm install
    echo ""
fi

# Информация о запуске
echo -e "${GREEN}Запуск Frontend dev сервера...${NC}"
echo -e "${YELLOW}Режим: Development (Vite HMR)${NC}"
echo -e "${YELLOW}URL: http://localhost:5173${NC}"
echo ""
echo -e "${YELLOW}Убедитесь, что Backend запущен на http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}Для остановки нажмите Ctrl+C${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
echo ""

# Запуск Vite dev сервера
npm run dev
