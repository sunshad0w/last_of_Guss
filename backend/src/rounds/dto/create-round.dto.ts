import { IsISO8601, IsNotEmpty } from 'class-validator';

/**
 * DTO для создания нового раунда
 */
export class CreateRoundDto {
  @IsNotEmpty()
  @IsISO8601()
  startTime!: string;
}
