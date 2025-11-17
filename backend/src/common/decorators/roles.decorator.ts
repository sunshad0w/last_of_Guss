import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

/**
 * Декоратор для указания требуемых ролей
 *
 * @param roles - Массив ролей, которые имеют доступ к эндпоинту
 *
 * @example
 * @Roles(UserRole.ADMIN)
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * async createRound() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
