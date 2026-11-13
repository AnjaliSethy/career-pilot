import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty() @IsEmail() @MaxLength(254) email: string;
  @ApiProperty({ minLength: 10 }) @IsString() @MinLength(10) @MaxLength(128) password: string;
}

export class LoginDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() @MaxLength(128) password: string;
}
