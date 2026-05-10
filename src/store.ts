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

const KEYS = {
  tx: '@bk/transactions',
  cats: '@bk/categories',
  budgets: '@bk/budgets',
  theme: '@bk/theme',
};

type State = {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  themeMode: ThemeMode;
  selectedMonth: SelectedMonth;
  hydrated: boolean;

  hydrate: () => Promise<void>;

  addTx: (t: Omit<Transaction, 'id'>) => Promise<void>;
  updateTx: (id: string, patch: Partial<Omit<Transaction, 'id'>>) => Promise<void>;
  removeTx: (id: string) => Promise<void>;
  importTxs: (items: Transaction[]) => Promise<void>;

  addCategory: (c: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, patch: Partial<Omit<Category, 'id'>>) => Promise<void>;
  removeCategory: (id: string) => Promise<{ ok: boolean; reason?: string }>;

  setBudget: (categoryId: string, amount: number) => Promise<void>;
  removeBudget: (categoryId: string) => Promise<void>;

  setThemeMode: (m: ThemeMode) => Promise<void>;

  setSelectedMonth: (m: SelectedMonth) => void;
  shiftMonth: (delta: number) => void;
  resetSelectedMonth: () => void;

  clearAll: () => Promise<void>;
};

const newId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const persist = async (key: string, value: unknown) => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

const today = () => {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() };
};

export const useStore = create<State>((set, get) => ({
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  budgets: [],
  themeMode: 'system',
  selectedMonth: today(),
  hydrated: false,

  hydrate: async () => {
    try {
      const [txRaw, catsRaw, budgetsRaw, themeRaw] = await Promise.all([
        AsyncStorage.getItem(KEYS.tx),
        AsyncStorage.getItem(KEYS.cats),
        AsyncStorage.getItem(KEYS.budgets),
        AsyncStorage.getItem(KEYS.theme),
      ]);
      set({
        transactions: txRaw ? JSON.parse(txRaw) : [],
        categories: catsRaw ? JSON.parse(catsRaw) : DEFAULT_CATEGORIES,
        budgets: budgetsRaw ? JSON.parse(budgetsRaw) : [],
        themeMode: (themeRaw as ThemeMode) || 'system',
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  addTx: async (t) => {
    const tx: Transaction = { ...t, id: newId() };
    const next = [tx, ...get().transactions];
    set({ transactions: next });
    await persist(KEYS.tx, next);
  },

  updateTx: async (id, patch) => {
    const next = get().transactions.map((t) => (t.id === id ? { ...t, ...patch } : t));
    set({ transactions: next });
    await persist(KEYS.tx, next);
  },

  removeTx: async (id) => {
    const next = get().transactions.filter((t) => t.id !== id);
    set({ transactions: next });
    await persist(KEYS.tx, next);
  },

  importTxs: async (items) => {
    const have = new Set(get().transactions.map((t) => t.id));
    const additions = items.filter((t) => !have.has(t.id));
    const next = [...additions, ...get().transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    set({ transactions: next });
    await persist(KEYS.tx, next);
  },

  addCategory: async (c) => {
    const cat: Category = { ...c, id: newId(), isCustom: true };
    const next = [...get().categories, cat];
    set({ categories: next });
    await persist(KEYS.cats, next);
  },

  updateCategory: async (id, patch) => {
    const next = get().categories.map((c) => (c.id === id ? { ...c, ...patch } : c));
    set({ categories: next });
    await persist(KEYS.cats, next);
  },

  removeCategory: async (id) => {
    const used = get().transactions.some((t) => t.categoryId === id);
    if (used) return { ok: false, reason: '该分类已有记录，无法删除' };
    const next = get().categories.filter((c) => c.id !== id);
    const nextBudgets = get().budgets.filter((b) => b.categoryId !== id);
    set({ categories: next, budgets: nextBudgets });
    await Promise.all([persist(KEYS.cats, next), persist(KEYS.budgets, nextBudgets)]);
    return { ok: true };
  },

  setBudget: async (categoryId, amount) => {
    const others = get().budgets.filter((b) => b.categoryId !== categoryId);
    const next = amount > 0 ? [...others, { categoryId, amount }] : others;
    set({ budgets: next });
    await persist(KEYS.budgets, next);
  },

  removeBudget: async (categoryId) => {
    const next = get().budgets.filter((b) => b.categoryId !== categoryId);
    set({ budgets: next });
    await persist(KEYS.budgets, next);
  },

  setThemeMode: async (m) => {
    set({ themeMode: m });
    await AsyncStorage.setItem(KEYS.theme, m);
  },

  setSelectedMonth: (m) => set({ selectedMonth: m }),

  shiftMonth: (delta) => {
    const { year, month } = get().selectedMonth;
    const d = new Date(year, month + delta, 1);
    set({ selectedMonth: { year: d.getFullYear(), month: d.getMonth() } });
  },

  resetSelectedMonth: () => set({ selectedMonth: today() }),

  clearAll: async () => {
    await Promise.all([
      AsyncStorage.removeItem(KEYS.tx),
      AsyncStorage.removeItem(KEYS.cats),
      AsyncStorage.removeItem(KEYS.budgets),
    ]);
    set({
      transactions: [],
      categories: DEFAULT_CATEGORIES,
      budgets: [],
    });
  },
}));
