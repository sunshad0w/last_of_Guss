import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

/**
 * Health Check Module
 *
 * Модуль для проверки здоровья приложения
 */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
