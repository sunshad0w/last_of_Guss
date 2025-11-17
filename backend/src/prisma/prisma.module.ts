import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Глобальный модуль Prisma
 *
 * Делает PrismaService доступным во всех модулях приложения
 * без необходимости импортировать PrismaModule
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
