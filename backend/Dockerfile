# ================================
# Stage 1: Dependencies
# ================================
FROM node:20-alpine AS deps

WORKDIR /app

# Устанавливаем OpenSSL для Prisma
RUN apk add --no-cache openssl openssl-dev

# Копируем package files
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm ci --only=production && \
    npm cache clean --force

# Генерируем Prisma Client с правильным binary target
RUN npx prisma generate

# ================================
# Stage 2: Builder
# ================================
FROM node:20-alpine AS builder

WORKDIR /app

# Устанавливаем OpenSSL для Prisma
RUN apk add --no-cache openssl openssl-dev

# Копируем package files
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Устанавливаем все зависимости (включая dev)
RUN npm ci

# Копируем исходный код
COPY src ./src

# Генерируем Prisma Client
RUN npx prisma generate

# Собираем проект
RUN npm run build

# ================================
# Stage 3: Production
# ================================
FROM node:20-alpine AS production

WORKDIR /app

# Устанавливаем необходимые зависимости: dumb-init и OpenSSL для Prisma
RUN apk add --no-cache dumb-init openssl openssl-dev

# Создаём пользователя без root прав
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Копируем production dependencies из deps stage
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nodejs:nodejs /app/prisma ./prisma

# Копируем собранный код из builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Переключаемся на пользователя nodejs
USER nodejs

# Открываем порт
EXPOSE 3000

# Healthcheck для Docker
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Запускаем с dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
