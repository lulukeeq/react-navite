import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { TxType } from '../../entities/transaction-type.enum';

export class TransactionUpsertDto {
  @IsUUID('4')
  id: string;

  @IsEnum(TxType)
  type: TxType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @IsUUID('4')
  categoryId: string;

  @IsString()
  @MaxLength(200)
  note: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date: string;
}

export class CategoryUpsertDto {
  @IsUUID('4')
  id: string;

  @IsString()
  @MaxLength(64)
  name: string;

  @IsEnum(TxType)
  type: TxType;

  @IsBoolean()
  @IsOptional()
  isCustom?: boolean;
}

export class BudgetUpsertDto {
  @IsUUID('4')
  id: string;

  @IsUUID('4')
  categoryId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @IsString()
  @MaxLength(16)
  @IsOptional()
  period?: string;
}

export class TransactionChangesDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => TransactionUpsertDto)
  upserts: TransactionUpsertDto[];

  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID('4', { each: true })
  deletes: string[];
}

export class CategoryChangesDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CategoryUpsertDto)
  upserts: CategoryUpsertDto[];

  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID('4', { each: true })
  deletes: string[];
}

export class BudgetChangesDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => BudgetUpsertDto)
  upserts: BudgetUpsertDto[];

  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID('4', { each: true })
  deletes: string[];
}

export class PushDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => TransactionChangesDto)
  transactions?: TransactionChangesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CategoryChangesDto)
  categories?: CategoryChangesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BudgetChangesDto)
  budgets?: BudgetChangesDto;
}
