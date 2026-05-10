import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Transaction,
  Category,
  Budget,
  ThemeMode,
  SelectedMonth,
  DEFAULT_CATEGORIES,
} from './types';
import {
  apiPull,
  apiPush,
  stripTransactionForPush,
  stripCategoryForPush,
  stripBudgetForPush,
  ServerTransaction,
  ServerCategory,
  ServerBudget,
} from './api/sync';

const THEME_KEY = '@bk/theme';

const userKeys = (userId: string) => ({
  tx: `@bk/${userId}/transactions`,
  cats: `@bk/${userId}/categories`,
  budgets: `@bk/${userId}/budgets`,
  lastSync: `@bk/${userId}/lastSync`,
});

const newId = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

const nowIso = () => new Date().toISOString();

const today = () => {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() };
};

type SyncStatus = 'idle' | 'syncing' | 'error';

type State = {
  userId: string | null;
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  themeMode: ThemeMode;
  selectedMonth: SelectedMonth;
  hydrated: boolean;
  lastSyncedAt: string | null;
  syncStatus: SyncStatus;
  syncError: string | null;

  hydrateTheme: () => Promise<void>;
  setScope: (userId: string | null) => Promise<void>;
  syncFromServer: (force?: boolean) => Promise<void>;

  addTx: (t: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTx: (id: string, patch: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  removeTx: (id: string) => Promise<void>;
  importTxs: (items: Transaction[]) => Promise<void>;

  addCategory: (c: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCategory: (id: string, patch: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  removeCategory: (id: string) => Promise<{ ok: boolean; reason?: string }>;

  setBudget: (categoryId: string, amount: number) => Promise<void>;
  removeBudget: (categoryId: string) => Promise<void>;

  setThemeMode: (m: ThemeMode) => Promise<void>;
  setSelectedMonth: (m: SelectedMonth) => void;
  shiftMonth: (delta: number) => void;
  resetSelectedMonth: () => void;

  clearAll: () => Promise<void>;
};

const persistJSON = (key: string, value: unknown) =>
  AsyncStorage.setItem(key, JSON.stringify(value));

const loadJSON = async <T,>(key: string, fallback: T): Promise<T> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const mergeUpsertById = <T extends { id: string }>(existing: T[], incoming: T[]): T[] => {
  if (incoming.length === 0) return existing;
  const map = new Map(existing.map((e) => [e.id, e]));
  for (const it of incoming) map.set(it.id, it);
  return Array.from(map.values());
};

const sortTxDesc = (a: Transaction, b: Transaction) => {
  const da = new Date(a.date).getTime();
  const db = new Date(b.date).getTime();
  if (db !== da) return db - da;
  const ua = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
  const ub = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
  return ub - ua;
};

export const useStore = create<State>((set, get) => ({
  userId: null,
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  budgets: [],
  themeMode: 'system',
  selectedMonth: today(),
  hydrated: false,
  lastSyncedAt: null,
  syncStatus: 'idle',
  syncError: null,

  hydrateTheme: async () => {
    const themeRaw = await AsyncStorage.getItem(THEME_KEY);
    set({ themeMode: (themeRaw as ThemeMode) || 'system' });
  },

  setScope: async (userId) => {
    if (userId === get().userId) {
      set({ hydrated: true });
      if (userId) void get().syncFromServer();
      return;
    }

    if (!userId) {
      set({
        userId: null,
        transactions: [],
        categories: DEFAULT_CATEGORIES,
        budgets: [],
        lastSyncedAt: null,
        syncStatus: 'idle',
        syncError: null,
        hydrated: true,
      });
      return;
    }

    set({ userId, hydrated: false, syncError: null });
    const k = userKeys(userId);
    const [transactions, categories, budgets, lastSyncedAt] = await Promise.all([
      loadJSON<Transaction[]>(k.tx, []),
      loadJSON<Category[]>(k.cats, []),
      loadJSON<Budget[]>(k.budgets, []),
      AsyncStorage.getItem(k.lastSync),
    ]);
    set({
      transactions: transactions.sort(sortTxDesc),
      categories: categories.length ? categories : [],
      budgets,
      lastSyncedAt,
      hydrated: true,
    });
    void get().syncFromServer();
  },

  syncFromServer: async (force) => {
    const { userId, lastSyncedAt, syncStatus } = get();
    if (!userId) return;
    if (syncStatus === 'syncing') return;
    set({ syncStatus: 'syncing', syncError: null });
    try {
      const since = force ? null : lastSyncedAt;
      const res = await apiPull(since);
      const k = userKeys(userId);

      const txKeep: Transaction[] = [];
      const txDeletes = new Set<string>();
      for (const t of res.transactions as ServerTransaction[]) {
        if (t.deletedAt) txDeletes.add(t.id);
        else txKeep.push(t);
      }
      let nextTx = since
        ? mergeUpsertById(get().transactions, txKeep).filter((t) => !txDeletes.has(t.id))
        : txKeep;
      nextTx = nextTx.sort(sortTxDesc);

      const catKeep: Category[] = [];
      const catDeletes = new Set<string>();
      for (const c of res.categories as ServerCategory[]) {
        if (c.deletedAt) catDeletes.add(c.id);
        else catKeep.push(c);
      }
      const nextCats = since
        ? mergeUpsertById(get().categories, catKeep).filter((c) => !catDeletes.has(c.id))
        : catKeep;

      const budgetKeep: Budget[] = [];
      const budgetDeletes = new Set<string>();
      for (const b of res.budgets as ServerBudget[]) {
        if (b.deletedAt) budgetDeletes.add(b.id);
        else budgetKeep.push(b);
      }
      const nextBudgets = since
        ? mergeUpsertById(get().budgets, budgetKeep).filter((b) => !budgetDeletes.has(b.id))
        : budgetKeep;

      set({
        transactions: nextTx,
        categories: nextCats,
        budgets: nextBudgets,
        lastSyncedAt: res.serverTime,
        syncStatus: 'idle',
      });
      await Promise.all([
        persistJSON(k.tx, nextTx),
        persistJSON(k.cats, nextCats),
        persistJSON(k.budgets, nextBudgets),
        AsyncStorage.setItem(k.lastSync, res.serverTime),
      ]);
    } catch (e: any) {
      set({ syncStatus: 'error', syncError: e?.message ?? 'sync failed' });
    }
  },

  addTx: async (t) => {
    const { userId } = get();
    if (!userId) return;
    const tx: Transaction = { ...t, id: newId(), createdAt: nowIso(), updatedAt: nowIso() };
    const next = [tx, ...get().transactions];
    set({ transactions: next });
    await persistJSON(userKeys(userId).tx, next);
    try {
      await apiPush({
        transactions: { upserts: [stripTransactionForPush(tx)], deletes: [] },
      });
    } catch (e) {
      console.warn('push tx upsert failed', e);
    }
  },

  updateTx: async (id, patch) => {
    const { userId } = get();
    if (!userId) return;
    const next = get().transactions
      .map((t) => (t.id === id ? { ...t, ...patch, updatedAt: nowIso() } : t))
      .sort(sortTxDesc);
    set({ transactions: next });
    await persistJSON(userKeys(userId).tx, next);
    const updated = next.find((t) => t.id === id);
    if (!updated) return;
    try {
      await apiPush({
        transactions: { upserts: [stripTransactionForPush(updated)], deletes: [] },
      });
    } catch (e) {
      console.warn('push tx update failed', e);
    }
  },

  removeTx: async (id) => {
    const { userId } = get();
    if (!userId) return;
    const next = get().transactions.filter((t) => t.id !== id);
    set({ transactions: next });
    await persistJSON(userKeys(userId).tx, next);
    try {
      await apiPush({
        transactions: { upserts: [], deletes: [id] },
      });
    } catch (e) {
      console.warn('push tx delete failed', e);
    }
  },

  importTxs: async (items) => {
    const { userId } = get();
    if (!userId) return;
    const have = new Set(get().transactions.map((t) => t.id));
    const additions: Transaction[] = [];
    for (const t of items) {
      if (have.has(t.id)) continue;
      additions.push({
        ...t,
        createdAt: t.createdAt ?? nowIso(),
        updatedAt: nowIso(),
      });
    }
    if (additions.length === 0) return;
    const next = [...additions, ...get().transactions].sort(sortTxDesc);
    set({ transactions: next });
    await persistJSON(userKeys(userId).tx, next);
    try {
      await apiPush({
        transactions: {
          upserts: additions.map(stripTransactionForPush),
          deletes: [],
        },
      });
    } catch (e) {
      console.warn('push tx import failed', e);
    }
  },

  addCategory: async (c) => {
    const { userId } = get();
    if (!userId) return;
    const cat: Category = {
      ...c,
      id: newId(),
      isCustom: true,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const next = [...get().categories, cat];
    set({ categories: next });
    await persistJSON(userKeys(userId).cats, next);
    try {
      await apiPush({
        categories: { upserts: [stripCategoryForPush(cat)], deletes: [] },
      });
    } catch (e) {
      console.warn('push category add failed', e);
    }
  },

  updateCategory: async (id, patch) => {
    const { userId } = get();
    if (!userId) return;
    const next = get().categories.map((c) =>
      c.id === id ? { ...c, ...patch, updatedAt: nowIso() } : c,
    );
    set({ categories: next });
    await persistJSON(userKeys(userId).cats, next);
    const updated = next.find((c) => c.id === id);
    if (!updated) return;
    try {
      await apiPush({
        categories: { upserts: [stripCategoryForPush(updated)], deletes: [] },
      });
    } catch (e) {
      console.warn('push category update failed', e);
    }
  },

  removeCategory: async (id) => {
    const { userId } = get();
    if (!userId) return { ok: false, reason: '未登录' };
    const used = get().transactions.some((t) => t.categoryId === id);
    if (used) return { ok: false, reason: '该分类已有记录，无法删除' };
    const next = get().categories.filter((c) => c.id !== id);
    const nextBudgets = get().budgets.filter((b) => b.categoryId !== id);
    set({ categories: next, budgets: nextBudgets });
    const k = userKeys(userId);
    await Promise.all([
      persistJSON(k.cats, next),
      persistJSON(k.budgets, nextBudgets),
    ]);
    try {
      await apiPush({
        categories: { upserts: [], deletes: [id] },
      });
    } catch (e) {
      console.warn('push category delete failed', e);
    }
    return { ok: true };
  },

  setBudget: async (categoryId, amount) => {
    const { userId } = get();
    if (!userId) return;
    const existing = get().budgets.find((b) => b.categoryId === categoryId);
    if (amount <= 0) {
      if (!existing) return;
      const next = get().budgets.filter((b) => b.categoryId !== categoryId);
      set({ budgets: next });
      await persistJSON(userKeys(userId).budgets, next);
      try {
        await apiPush({ budgets: { upserts: [], deletes: [existing.id] } });
      } catch (e) {
        console.warn('push budget delete failed', e);
      }
      return;
    }
    const updated: Budget = existing
      ? { ...existing, amount, updatedAt: nowIso() }
      : {
          id: newId(),
          categoryId,
          amount,
          period: 'monthly',
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
    const next = existing
      ? get().budgets.map((b) => (b.id === existing.id ? updated : b))
      : [...get().budgets, updated];
    set({ budgets: next });
    await persistJSON(userKeys(userId).budgets, next);
    try {
      await apiPush({
        budgets: { upserts: [stripBudgetForPush(updated)], deletes: [] },
      });
    } catch (e) {
      console.warn('push budget upsert failed', e);
    }
  },

  removeBudget: async (categoryId) => {
    await get().setBudget(categoryId, 0);
  },

  setThemeMode: async (m) => {
    set({ themeMode: m });
    await AsyncStorage.setItem(THEME_KEY, m);
  },

  setSelectedMonth: (m) => set({ selectedMonth: m }),

  shiftMonth: (delta) => {
    const { year, month } = get().selectedMonth;
    const d = new Date(year, month + delta, 1);
    set({ selectedMonth: { year: d.getFullYear(), month: d.getMonth() } });
  },

  resetSelectedMonth: () => set({ selectedMonth: today() }),

  clearAll: async () => {
    const { userId } = get();
    set({
      transactions: [],
      categories: [],
      budgets: [],
      lastSyncedAt: null,
    });
    if (userId) {
      const k = userKeys(userId);
      await Promise.all([
        AsyncStorage.removeItem(k.tx),
        AsyncStorage.removeItem(k.cats),
        AsyncStorage.removeItem(k.budgets),
        AsyncStorage.removeItem(k.lastSync),
      ]);
      await get().syncFromServer(true);
    }
  },
}));
