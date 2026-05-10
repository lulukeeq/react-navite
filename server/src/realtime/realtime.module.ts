import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeNotifier } from './realtime.notifier';

@Module({
  imports: [AuthModule],
  providers: [RealtimeGateway, RealtimeNotifier],
  exports: [RealtimeNotifier],
})
export class RealtimeModule {}
