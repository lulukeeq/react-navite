import { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { transactionsInMonth, formatCNY } from '../utils';
import { useColors } from '../colors';

export const BudgetsScreen = () => {
  const c = useColors();
  const {
    categories, budgets, transactions, selectedMonth, setBudget,
  } = useStore();

  const expenseCats = categories.filter((cc) => cc.type === 'expense');

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  useEffect(() => {
    const m: Record<string, string> = {};
    for (const b of budgets) m[b.categoryId] = String(b.amount);
    setDrafts(m);
  }, [budgets]);

  const spent = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of transactionsInMonth(transactions, selectedMonth)) {
      if (t.type !== 'expense') continue;
      m.set(t.categoryId, (m.get(t.categoryId) ?? 0) + t.amount);
    }
    return m;
  }, [transactions, selectedMonth]);

  const onCommit = async (categoryId: string) => {
    const raw = drafts[categoryId] ?? '';
    const num = Number(raw);
    if (raw === '' || !Number.isFinite(num) || num < 0) {
      await setBudget(categoryId, 0);
    } else {
      await setBudget(categoryId, Math.round(num * 100) / 100);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Text style={[styles.hint, { color: c.textMuted }]}>
          为每个支出分类设置每月预算上限，0 或留空表示不设置。
        </Text>
        {expenseCats.map((cat) => {
          const used = spent.get(cat.id) ?? 0;
          const budgetAmt = Number(drafts[cat.id] ?? '0') || 0;
          const pct = budgetAmt > 0 ? Math.min(used / budgetAmt, 1) : 0;
          const over = budgetAmt > 0 && used > budgetAmt;
          return (
            <View key={cat.id} style={[styles.card, { backgroundColor: c.card }]}>
              <View style={styles.head}>
                <Text style={[styles.name, { color: c.text }]}>{cat.name}</Text>
                <View style={styles.amountRow}>
                  <Text style={[styles.cny, { color: c.textMuted }]}>¥</Text>
                  <TextInput
                    style={[styles.input, { color: c.text, borderColor: c.border }]}
                    value={drafts[cat.id] ?? ''}
                    onChangeText={(v) => setDrafts((p) => ({ ...p, [cat.id]: v }))}
                    onBlur={() => onCommit(cat.id)}
                    placeholder="0"
                    placeholderTextColor={c.textDim}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              {budgetAmt > 0 && (
                <>
                  <View style={[styles.bar, { backgroundColor: c.border }]}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.max(pct * 100, 2)}%`,
                          backgroundColor: over ? c.expense : c.primary,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.statusRow}>
                    <Text style={[styles.status, { color: c.textMuted }]}>
                      已用 {formatCNY(used)} / {formatCNY(budgetAmt)}
                    </Text>
                    <Text style={{ color: over ? c.expense : c.income, fontSize: 12 }}>
                      {over ? `超支 ${formatCNY(used - budgetAmt)}` : `剩余 ${formatCNY(budgetAmt - used)}`}
                    </Text>
                  </View>
                </>
              )}
            </View>
          );
        })}
        <Pressable style={[styles.commitBtn]}>
          <Text style={[styles.commitText, { color: c.textDim }]}>
            （输入框失焦或提交后自动保存）
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  hint: { fontSize: 13, marginBottom: 12 },
  card: { borderRadius: 10, padding: 14, marginBottom: 10 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '500' },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  cny: { fontSize: 14, marginRight: 4 },
  input: {
    borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6,
    fontSize: 15, minWidth: 90, textAlign: 'right',
  },
  bar: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 12 },
  barFill: { height: '100%' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  status: { fontSize: 12 },
  commitBtn: { padding: 12, alignItems: 'center' },
  commitText: { fontSize: 12 },
});
