import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RoundsModule } from './rounds/rounds.module';
import { TapsModule } from './taps/taps.module';
import { HealthModule } from './health/health.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

/**
 * Главный модуль приложения
 *
 * Импортирует:
 * - ConfigModule - для работы с переменными окружения
 * - PrismaModule - для работы с базой данных
 * - AuthModule - для аутентификации
 * - RoundsModule - для управления раундами
 * - TapsModule - для обработки тапов
 * - HealthModule - для health check endpoints
 *
 * Глобальные провайдеры:
 * - HttpExceptionFilter - единообразная обработка ошибок
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    RoundsModule,
    TapsModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
