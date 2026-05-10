import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useStore } from '../store';
import { formatMonthLabel } from '../utils';
import { useColors } from '../colors';

export const MonthBar = () => {
  const c = useColors();
  const { selectedMonth, shiftMonth, resetSelectedMonth } = useStore();
  const isCurrent = (() => {
    const d = new Date();
    return selectedMonth.year === d.getFullYear() && selectedMonth.month === d.getMonth();
  })();

  return (
    <View style={[styles.bar, { backgroundColor: c.card, borderBottomColor: c.border }]}>
      <Pressable onPress={() => shiftMonth(-1)} style={styles.arrow} hitSlop={12}>
        <Text style={[styles.arrowText, { color: c.text }]}>‹</Text>
      </Pressable>
      <Pressable onPress={resetSelectedMonth} style={styles.center}>
        <Text style={[styles.label, { color: c.text }]}>{formatMonthLabel(selectedMonth)}</Text>
        {!isCurrent && (
          <Text style={[styles.todayHint, { color: c.primary }]}>点击回到本月</Text>
        )}
      </Pressable>
      <Pressable
        onPress={() => isCurrent ? null : shiftMonth(1)}
        style={[styles.arrow, isCurrent && styles.disabled]}
        hitSlop={12}
        disabled={isCurrent}
      >
        <Text style={[styles.arrowText, { color: isCurrent ? c.textDim : c.text }]}>›</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  arrow: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 24, fontWeight: '300' },
  disabled: { opacity: 0.4 },
  center: { flex: 1, alignItems: 'center' },
  label: { fontSize: 16, fontWeight: '600' },
  todayHint: { fontSize: 11, marginTop: 2 },
});
