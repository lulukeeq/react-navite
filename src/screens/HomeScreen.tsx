import { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store';
import { transactionsInMonth, sumByType } from '../utils';
import { useColors } from '../colors';
import { SummaryCard } from '../components/SummaryCard';
import { TransactionItem } from '../components/TransactionItem';
import { MonthBar } from '../components/MonthBar';

export const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const c = useColors();
  const {
    transactions, categories, removeTx, selectedMonth,
  } = useStore();

  const monthTxs = useMemo(
    () => transactionsInMonth(transactions, selectedMonth),
    [transactions, selectedMonth],
  );
  const { income, expense } = useMemo(() => sumByType(monthTxs), [monthTxs]);

  const catMap = useMemo(
    () => Object.fromEntries(categories.map((cc) => [cc.id, cc])),
    [categories],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <MonthBar />
      <FlatList
        data={monthTxs}
        keyExtractor={(t) => t.id}
        ListHeaderComponent={<SummaryCard income={income} expense={expense} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: c.textDim }}>本月还没有记录，点右下角 + 开始</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TransactionItem
            tx={item}
            category={catMap[item.categoryId]}
            onPress={(id) => navigation.navigate('Edit', { id })}
            onDelete={removeTx}
          />
        )}
      />
      <Pressable
        style={[styles.fab, { backgroundColor: c.primary }]}
        onPress={() => navigation.navigate('Edit')}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { padding: 40, alignItems: 'center' },
  fab: {
    position: 'absolute',
    right: 24, bottom: 32,
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '600', marginTop: -2 },
});
