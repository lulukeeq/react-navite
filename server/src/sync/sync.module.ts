import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../entities/transaction.entity';
import { Category } from '../entities/category.entity';
import { Budget } from '../entities/budget.entity';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Category, Budget]),
    AuthModule,
    RealtimeModule,
  ],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
