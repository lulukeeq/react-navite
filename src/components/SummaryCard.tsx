import { View, Text, StyleSheet } from 'react-native';
import { formatCNY } from '../utils';
import { useColors } from '../colors';

type Props = { income: number; expense: number };

export const SummaryCard = ({ income, expense }: Props) => {
  const c = useColors();
  const balance = income - expense;
  return (
    <View style={[styles.card, { backgroundColor: c.card }]}>
      <Text style={[styles.title, { color: c.textMuted }]}>本月汇总</Text>
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={[styles.label, { color: c.textDim }]}>支出</Text>
          <Text style={[styles.value, { color: c.expense }]}>{formatCNY(expense)}</Text>
        </View>
        <View style={styles.col}>
          <Text style={[styles.label, { color: c.textDim }]}>收入</Text>
          <Text style={[styles.value, { color: c.income }]}>{formatCNY(income)}</Text>
        </View>
        <View style={styles.col}>
          <Text style={[styles.label, { color: c.textDim }]}>结余</Text>
          <Text style={[styles.value, { color: balance >= 0 ? c.income : c.expense }]}>
            {formatCNY(balance)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: { fontSize: 14, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { alignItems: 'center', flex: 1 },
  label: { fontSize: 12, marginBottom: 4 },
  value: { fontSize: 18, fontWeight: '600' },
});
