import {
  IsEmail,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;
  @IsStrongPassword()
  password: string;
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;
}
