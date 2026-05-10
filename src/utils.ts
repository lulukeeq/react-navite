import { SelectedMonth, Transaction } from './types';

export const formatCNY = (n: number) =>
  '¥' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const pad = (n: number) => String(n).padStart(2, '0');

export const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const formatMonthLabel = (m: SelectedMonth) => `${m.year}年${m.month + 1}月`;

export const isSameMonth = (iso: string, ref: SelectedMonth) => {
  const d = new Date(iso);
  return d.getFullYear() === ref.year && d.getMonth() === ref.month;
};

export const transactionsInMonth = (txs: Transaction[], m: SelectedMonth) =>
  txs.filter((t) => isSameMonth(t.date, m));

export const sumByType = (txs: Transaction[]) => {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  }
  return { income, expense };
};

export const escapeCsv = (s: string) =>
  /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;

export const txsToCSV = (txs: Transaction[]) => {
  const header = 'id,type,amount,categoryId,note,date';
  const rows = txs.map((t) =>
    [t.id, t.type, t.amount, t.categoryId, escapeCsv(t.note), t.date]
      .map((v) => String(v))
      .map(escapeCsv)
      .join(','),
  );
  return [header, ...rows].join('\n');
};

const parseCsvLine = (line: string): string[] => {
  const out: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuote = false;
      } else {
        cur += ch;
      }
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else if (ch === '"') {
      inQuote = true;
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
};

export const csvToTxs = (csv: string): Transaction[] => {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = parseCsvLine(lines[0]).map((s) => s.trim());
  const idx = (k: string) => header.indexOf(k);
  const iId = idx('id');
  const iType = idx('type');
  const iAmount = idx('amount');
  const iCategoryId = idx('categoryId');
  const iNote = idx('note');
  const iDate = idx('date');
  const out: Transaction[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const t = cols[iType];
    if (t !== 'income' && t !== 'expense') continue;
    const amount = Number(cols[iAmount]);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    out.push({
      id: cols[iId] || Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      type: t,
      amount,
      categoryId: cols[iCategoryId] ?? '',
      note: cols[iNote] ?? '',
      date: cols[iDate] || new Date().toISOString(),
    });
  }
  return out;
};
