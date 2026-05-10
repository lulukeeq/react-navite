import { IsString, Length, Matches } from 'class-validator';

export class RegisterDto {
  @Matches(/^\+?\d{6,20}$/, { message: 'phone must be a digit-only string (6-20 digits, optional + prefix)' })
  phone: string;

  @IsString()
  @Length(6, 64)
  password: string;
}
