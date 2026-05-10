import { IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @Matches(/^\+?\d{6,20}$/)
  phone: string;

  @IsString()
  @Length(6, 64)
  password: string;
}
