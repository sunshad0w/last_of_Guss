import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import * as express from 'express';

/**
 * Точка входа приложения
 *
 * Настраивает:
 * - CORS для фронтенда
 * - Глобальную валидацию (class-validator)
 * - UTF-8 кодировку для всех JSON ответов
 * - Порт сервера
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Настройка express middleware для правильной обработки UTF-8
  app.use(express.json({ type: 'application/json' }));
  app.use(express.urlencoded({ extended: true }));

  // Включаем CORS для фронтенда
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:5173'),
    credentials: true,
  });

  // Глобальная валидация
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Удалять поля, не описанные в DTO
      forbidNonWhitelisted: true, // Ошибка если есть неописанные поля
      transform: true, // Автоматическая трансформация типов
    }),
  );

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  console.log(`🚀 Сервер запущен на http://localhost:${port}`);
  console.log(`📚 Документация API: см. docs/api.md`);
}

bootstrap();
