import { apiFetch } from './client';
import { Transaction, Category, Budget } from '../types';

export type ServerTransaction = Transaction & { userId: string; deletedAt: string | null };
export type ServerCategory = Category & { userId: string; deletedAt: string | null };
export type ServerBudget = Budget & { userId: string; deletedAt: string | null };

export type PullResponse = {
  serverTime: string;
  transactions: ServerTransaction[];
  categories: ServerCategory[];
  budgets: ServerBudget[];
};

export const apiPull = (since?: string | null) => {
  const qs = since ? `?since=${encodeURIComponent(since)}` : '';
  return apiFetch<PullResponse>(`/sync/pull${qs}`);
};

type TxUpsert = {
  id: string;
  type: Transaction['type'];
  amount: number;
  categoryId: string;
  note: string;
  date: string;
};

type CatUpsert = {
  id: string;
  name: string;
  type: Category['type'];
  isCustom?: boolean;
};

type BudgetUpsert = {
  id: string;
  categoryId: string;
  amount: number;
  period?: string;
};

export type PushPayload = {
  transactions?: { upserts: TxUpsert[]; deletes: string[] };
  categories?: { upserts: CatUpsert[]; deletes: string[] };
  budgets?: { upserts: BudgetUpsert[]; deletes: string[] };
};

export type PushResponse = {
  serverTime: string;
  accepted: { transactions: number; categories: number; budgets: number };
};

export const apiPush = (payload: PushPayload) =>
  apiFetch<PushResponse>('/sync/push', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const stripTransactionForPush = (t: Transaction): TxUpsert => ({
  id: t.id,
  type: t.type,
  amount: t.amount,
  categoryId: t.categoryId,
  note: t.note,
  date: t.date,
});

export const stripCategoryForPush = (c: Category): CatUpsert => ({
  id: c.id,
  name: c.name,
  type: c.type,
  isCustom: c.isCustom,
});

export const stripBudgetForPush = (b: Budget): BudgetUpsert => ({
  id: b.id,
  categoryId: b.categoryId,
  amount: b.amount,
  period: b.period,
});
