import { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { transactionsInMonth, formatCNY } from '../utils';
import { TransactionType } from '../types';
import { useColors } from '../colors';
import { MonthBar } from '../components/MonthBar';
import { PieChart } from '../components/PieChart';

export const StatsScreen = () => {
  const c = useColors();
  const { transactions, categories, selectedMonth } = useStore();
  const [type, setType] = useState<TransactionType>('expense');

  const stats = useMemo(() => {
    const monthTxs = transactionsInMonth(transactions, selectedMonth).filter(
      (t) => t.type === type,
    );
    const totals = new Map<string, number>();
    let total = 0;
    for (const t of monthTxs) {
      total += t.amount;
      totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
    }
    const items = Array.from(totals.entries())
      .map(([id, amount]) => {
        const cat = categories.find((cc) => cc.id === id);
        return {
          id,
          name: cat?.name ?? '未知',
          value: amount,
        };
      })
      .sort((a, b) => b.value - a.value);
    return { items, total };
  }, [transactions, categories, selectedMonth, type]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <MonthBar />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={[styles.tabs, { backgroundColor: c.border }]}>
          {(['expense', 'income'] as const).map((t) => (
            <Pressable
              key={t}
              style={[styles.tab, type === t && { backgroundColor: c.card }]}
              onPress={() => setType(t)}
            >
              <Text
                style={{
                  color: type === t ? c.text : c.textMuted,
                  fontSize: 14,
                  fontWeight: type === t ? '600' : '400',
                }}
              >
                {t === 'expense' ? '支出' : '收入'}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: c.card }]}>
          <PieChart data={stats.items} />
        </View>

        <Text style={[styles.heading, { color: c.textMuted }]}>分类明细</Text>
        {stats.items.length === 0 ? (
          <Text style={[styles.empty, { color: c.textDim }]}>暂无{type === 'expense' ? '支出' : '收入'}记录</Text>
        ) : (
          stats.items.map((it) => (
            <View key={it.id} style={[styles.row, { backgroundColor: c.card }]}>
              <View style={styles.rowHead}>
                <Text style={[styles.name, { color: c.text }]}>{it.name}</Text>
                <Text style={{ color: type === 'expense' ? c.expense : c.income, fontWeight: '600' }}>
                  {formatCNY(it.value)}
                </Text>
              </View>
              <View style={[styles.barBg, { backgroundColor: c.border }]}>
                <View
                  style={[
                    styles.barFg,
                    {
                      width: `${stats.total ? Math.max((it.value / stats.total) * 100, 2) : 2}%`,
                      backgroundColor: c.primary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.pct, { color: c.textDim }]}>
                {stats.total ? ((it.value / stats.total) * 100).toFixed(1) : '0.0'}%
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: { flexDirection: 'row', borderRadius: 8, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  card: { borderRadius: 12, padding: 16, marginBottom: 16 },
  heading: { fontSize: 13, marginBottom: 8 },
  empty: { textAlign: 'center', marginTop: 40 },
  row: { borderRadius: 8, padding: 12, marginBottom: 8 },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  name: { fontSize: 15, fontWeight: '500' },
  barBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFg: { height: '100%' },
  pct: { fontSize: 11, marginTop: 4, textAlign: 'right' },
});
