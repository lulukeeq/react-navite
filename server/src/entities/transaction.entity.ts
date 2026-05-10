import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TxType } from './transaction-type.enum';
import { decimalTransformer } from '../common/decimal-transformer';

@Entity('transactions')
@Index('idx_tx_user_updated', ['userId', 'updatedAt'])
@Index('idx_tx_user_date', ['userId', 'date'])
export class Transaction {
  @PrimaryColumn({ type: 'char', length: 36 })
  id: string;

  @Column({ type: 'char', length: 36 })
  userId: string;

  @Column({ type: 'enum', enum: TxType })
  type: TxType;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;

  @Column({ type: 'char', length: 36 })
  categoryId: string;

  @Column({ type: 'varchar', length: 200, default: '' })
  note: string;

  @Column({ type: 'date' })
  date: string;

  @CreateDateColumn({ type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', precision: 6 })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'datetime', precision: 6, nullable: true })
  deletedAt: Date | null;
}
