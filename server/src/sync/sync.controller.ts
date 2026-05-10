import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SyncService } from './sync.service';
import { PullQueryDto } from './dto/pull.dto';
import { PushDto } from './dto/push.dto';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly sync: SyncService) {}

  @Get('pull')
  pull(@CurrentUser('userId') userId: string, @Query() q: PullQueryDto) {
    return this.sync.pull(userId, q.since);
  }

  @Post('push')
  @HttpCode(200)
  push(@CurrentUser('userId') userId: string, @Body() body: PushDto) {
    return this.sync.push(userId, body);
  }
}
