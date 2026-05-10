import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Transaction, Category } from '../types';
import { formatCNY, formatDateTime } from '../utils';
import { useColors } from '../colors';

type Props = {
  tx: Transaction;
  category?: Category;
  onPress: (id: string) => void;
  onDelete: (id: string) => void;
};

export const TransactionItem = ({ tx, category, onPress, onDelete }: Props) => {
  const c = useColors();
  return (
    <Pressable
      style={[styles.row, { backgroundColor: c.card, borderBottomColor: c.border }]}
      onPress={() => onPress(tx.id)}
      onLongPress={() =>
        Alert.alert('删除', '确定删除这条记录吗？', [
          { text: '取消', style: 'cancel' },
          { text: '删除', style: 'destructive', onPress: () => onDelete(tx.id) },
        ])
      }
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.cat, { color: c.text }]}>{category?.name ?? '未知'}</Text>
        {tx.note ? <Text style={[styles.note, { color: c.textMuted }]}>{tx.note}</Text> : null}
        <Text style={[styles.date, { color: c.textDim }]}>{formatDateTime(tx.date)}</Text>
      </View>
      <Text
        style={[
          styles.amount,
          { color: tx.type === 'income' ? c.income : c.expense },
        ]}
      >
        {tx.type === 'income' ? '+' : '-'}
        {formatCNY(tx.amount)}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cat: { fontSize: 16, fontWeight: '500' },
  note: { fontSize: 13, marginTop: 2 },
  date: { fontSize: 11, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '600' },
});
