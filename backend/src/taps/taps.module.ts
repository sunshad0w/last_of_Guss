import { Module } from '@nestjs/common';
import { TapsService } from './taps.service';
import { TapsController } from './taps.controller';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TapsController],
  providers: [TapsService, RateLimitGuard],
})
export class TapsModule {}
