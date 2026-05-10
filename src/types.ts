export type TransactionType = 'income' | 'expense';

export type Category = {
  id: string;
  name: string;
  type: TransactionType;
  isCustom?: boolean;
};

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  note: string;
  date: string;
};

export type Budget = {
  categoryId: string;
  amount: number;
};

export type ThemeMode = 'light' | 'dark' | 'system';

export type SelectedMonth = { year: number; month: number };

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: '餐饮', type: 'expense' },
  { id: 'transport', name: '交通', type: 'expense' },
  { id: 'shopping', name: '购物', type: 'expense' },
  { id: 'entertainment', name: '娱乐', type: 'expense' },
  { id: 'housing', name: '住房', type: 'expense' },
  { id: 'medical', name: '医疗', type: 'expense' },
  { id: 'education', name: '教育', type: 'expense' },
  { id: 'other-expense', name: '其他', type: 'expense' },
  { id: 'salary', name: '工资', type: 'income' },
  { id: 'bonus', name: '奖金', type: 'income' },
  { id: 'investment', name: '投资', type: 'income' },
  { id: 'other-income', name: '其他', type: 'income' },
];
