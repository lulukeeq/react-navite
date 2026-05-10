import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { loadConfig, AppConfig } from './config/configuration';
import { User } from './entities/user.entity';
import { Category } from './entities/category.entity';
import { Transaction } from './entities/transaction.entity';
import { Budget } from './entities/budget.entity';
import { AuthModule } from './auth/auth.module';
import { SyncModule } from './sync/sync.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService<AppConfig>) => {
        const db = cfg.get('db', { infer: true })!;
        return {
          type: 'mysql',
          host: db.host,
          port: db.port,
          username: db.username,
          password: db.password,
          database: db.database,
          entities: [User, Category, Transaction, Budget],
          synchronize: db.synchronize,
          charset: 'utf8mb4',
          timezone: 'Z',
          logging: ['error', 'warn'],
          extra: { decimalNumbers: false },
        };
      },
    }),
    AuthModule,
    SyncModule,
    RealtimeModule,
  ],
})
export class AppModule {}
