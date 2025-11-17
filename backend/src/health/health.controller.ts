import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Health Check Controller
 *
 * Предоставляет endpoints для проверки здоровья приложения
 * Используется Docker, Kubernetes, load balancers
 */
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Простая проверка работоспособности приложения
   *
   * @returns Статус "ok"
   *
   * @example
   * GET /health
   * Response: { status: "ok", timestamp: "2025-11-17T10:30:00.000Z" }
   */
  @Get('health')
  async health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Детальная проверка с подключением к БД
   *
   * @returns Детальная информация о состоянии
   *
   * @example
   * GET /health/detailed
   * Response: {
   *   status: "ok",
   *   timestamp: "2025-11-17T10:30:00.000Z",
   *   database: "connected",
   *   uptime: 12345
   * }
   */
  @Get('health/detailed')
  async detailedHealth() {
    let databaseStatus = 'unknown';

    try {
      // Проверяем подключение к БД
      await this.prisma.$queryRaw`SELECT 1`;
      databaseStatus = 'connected';
    } catch (error) {
      databaseStatus = 'disconnected';
    }

    return {
      status: databaseStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database: databaseStatus,
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    };
  }

  /**
   * Liveness probe для Kubernetes
   * Проверяет, что приложение живо и не зависло
   */
  @Get('health/liveness')
  liveness() {
    return { status: 'alive' };
  }

  /**
   * Readiness probe для Kubernetes
   * Проверяет, что приложение готово принимать трафик
   */
  @Get('health/readiness')
  async readiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready' };
    } catch {
      return { status: 'not ready' };
    }
  }
}
