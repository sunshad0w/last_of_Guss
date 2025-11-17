import { IsString, MinLength, MaxLength } from 'class-validator';

/**
 * DTO для входа/регистрации пользователя
 */
export class LoginDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  username!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;
}
