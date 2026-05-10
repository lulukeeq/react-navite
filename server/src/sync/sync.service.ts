import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityTarget, In, MoreThan, ObjectLiteral } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { Category } from '../entities/category.entity';
import { Budget } from '../entities/budget.entity';
import { PushDto } from './dto/push.dto';
import { RealtimeNotifier } from '../realtime/realtime.notifier';

type SyncResult = {
  serverTime: string;
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
};

type PushResult = {
  serverTime: string;
  accepted: { transactions: number; categories: number; budgets: number };
};

@Injectable()
export class SyncService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly notifier: RealtimeNotifier,
  ) {}

  async pull(userId: string, since?: string): Promise<SyncResult> {
    const sinceFilter = since ? { updatedAt: MoreThan(new Date(since)) } : {};
    const where = { userId, ...sinceFilter };
    const opts = { where, withDeleted: true };
    const [transactions, categories, budgets] = await Promise.all([
      this.ds.getRepository(Transaction).find(opts),
      this.ds.getRepository(Category).find(opts),
      this.ds.getRepository(Budget).find(opts),
    ]);
    return {
      serverTime: new Date().toISOString(),
      transactions,
      categories,
      budgets,
    };
  }

  async push(userId: string, body: PushDto): Promise<PushResult> {
    let txCount = 0;
    let catCount = 0;
    let budgetCount = 0;

    await this.ds.transaction(async (em) => {
      if (body.transactions) {
        const { upserts, deletes } = body.transactions;
        for (const u of upserts) {
          await this.upsertOwned(em, Transaction, userId, u.id, {
            type: u.type,
            amount: u.amount,
            categoryId: u.categoryId,
            note: u.note,
            date: u.date,
          });
        }
        await this.softDeleteOwned(em, Transaction, userId, deletes);
        txCount = upserts.length + deletes.length;
      }

      if (body.categories) {
        const { upserts, deletes } = body.categories;
        for (const u of upserts) {
          await this.upsertOwned(em, Category, userId, u.id, {
            name: u.name,
            type: u.type,
            isCustom: u.isCustom ?? true,
          });
        }
        await this.softDeleteOwned(em, Category, userId, deletes);
        catCount = upserts.length + deletes.length;
      }

      if (body.budgets) {
        const { upserts, deletes } = body.budgets;
        for (const u of upserts) {
          await this.upsertOwned(em, Budget, userId, u.id, {
            categoryId: u.categoryId,
            amount: u.amount,
            period: u.period ?? 'monthly',
          });
        }
        await this.softDeleteOwned(em, Budget, userId, deletes);
        budgetCount = upserts.length + deletes.length;
      }
    });

    const serverTime = new Date().toISOString();
    if (txCount + catCount + budgetCount > 0) {
      this.notifier.notifyChanged(userId, serverTime);
    }

    return {
      serverTime,
      accepted: { transactions: txCount, categories: catCount, budgets: budgetCount },
    };
  }

  private async upsertOwned<T extends ObjectLiteral & { id: string; userId: string; deletedAt: Date | null }>(
    em: import('typeorm').EntityManager,
    target: EntityTarget<T>,
    userId: string,
    id: string,
    data: Partial<T>,
  ) {
    const repo = em.getRepository(target);
    const existing = await repo.findOne({ where: { id } as any, withDeleted: true });
    if (existing) {
      if (existing.userId !== userId) {
        throw new ForbiddenException('该记录不属于当前用户');
      }
      await repo.update({ id } as any, { ...data, deletedAt: null } as any);
    } else {
      await repo.insert({ ...data, id, userId } as any);
    }
  }

  private async softDeleteOwned<T extends ObjectLiteral & { id: string; userId: string }>(
    em: import('typeorm').EntityManager,
    target: EntityTarget<T>,
    userId: string,
    ids: string[],
  ) {
    if (ids.length === 0) return;
    const repo = em.getRepository(target);
    const rows = await repo.find({ where: { id: In(ids) } as any, withDeleted: true });
    if (rows.length === 0) return;
    for (const r of rows) {
      if (r.userId !== userId) {
        throw new ForbiddenException('试图删除非本人记录');
      }
    }
    const ownIds = rows.map((r) => r.id);
    await repo.softDelete({ id: In(ownIds) } as any);
  }
}
