import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

@Injectable()
export class RealtimeNotifier {
  constructor(private readonly gateway: RealtimeGateway) {}

  notifyChanged(userId: string, serverTime: string) {
    this.gateway.emitChangedTo(userId, serverTime);
  }
}
