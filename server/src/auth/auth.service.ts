import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { User } from '../entities/user.entity';
import { Category } from '../entities/category.entity';
import { TxType } from '../entities/transaction-type.enum';
import { AppConfig } from '../config/configuration';
import { JwtPayload } from './jwt-payload';

const DEFAULT_CATEGORIES: { name: string; type: TxType }[] = [
  { name: '餐饮', type: TxType.EXPENSE },
  { name: '交通', type: TxType.EXPENSE },
  { name: '购物', type: TxType.EXPENSE },
  { name: '娱乐', type: TxType.EXPENSE },
  { name: '住房', type: TxType.EXPENSE },
  { name: '医疗', type: TxType.EXPENSE },
  { name: '教育', type: TxType.EXPENSE },
  { name: '其他', type: TxType.EXPENSE },
  { name: '工资', type: TxType.INCOME },
  { name: '奖金', type: TxType.INCOME },
  { name: '投资', type: TxType.INCOME },
  { name: '其他', type: TxType.INCOME },
];

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Category) private readonly categories: Repository<Category>,
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService<AppConfig>,
  ) {}

  async register(phone: string, password: string) {
    const existing = await this.users.findOne({ where: { phone } });
    if (existing) throw new ConflictException('该手机号已注册');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.users.save(this.users.create({ phone, passwordHash }));

    await this.seedDefaultCategories(user.id);

    return this.issueTokens(user);
  }

  async login(phone: string, password: string) {
    const user = await this.users.findOne({ where: { phone } });
    if (!user) throw new UnauthorizedException('账号或密码错误');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('账号或密码错误');
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    const jwtCfg = this.cfg.get('jwt', { infer: true })!;
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: jwtCfg.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('refresh token 无效或已过期');
    }
    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException();
    return { accessToken: await this.signAccess(user) };
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    const jwtCfg = this.cfg.get('jwt', { infer: true })!;
    return this.jwt.verifyAsync<JwtPayload>(token, { secret: jwtCfg.accessSecret });
  }

  private async issueTokens(user: User) {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccess(user),
      this.signRefresh(user),
    ]);
    return {
      user: { id: user.id, phone: user.phone },
      accessToken,
      refreshToken,
    };
  }

  private async signAccess(user: User): Promise<string> {
    const jwtCfg = this.cfg.get('jwt', { infer: true })!;
    const payload: JwtPayload = { sub: user.id, phone: user.phone };
    return this.jwt.signAsync(payload, {
      secret: jwtCfg.accessSecret,
      expiresIn: jwtCfg.accessTtl,
    });
  }

  private async signRefresh(user: User): Promise<string> {
    const jwtCfg = this.cfg.get('jwt', { infer: true })!;
    const payload: JwtPayload = { sub: user.id, phone: user.phone };
    return this.jwt.signAsync(payload, {
      secret: jwtCfg.refreshSecret,
      expiresIn: jwtCfg.refreshTtl,
    });
  }

  private async seedDefaultCategories(userId: string) {
    const items = DEFAULT_CATEGORIES.map((c) => ({
      id: uuid(),
      userId,
      name: c.name,
      type: c.type,
      isCustom: false,
    }));
    await this.categories.save(items);
  }
}
