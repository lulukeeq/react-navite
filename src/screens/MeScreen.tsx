import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store';
import { useSession } from '../auth/sessionStore';
import { formatCNY } from '../utils';
import { useColors } from '../colors';

const Row = ({
  title, hint, onPress, danger,
}: {
  title: string;
  hint?: string;
  onPress: () => void;
  danger?: boolean;
}) => {
  const c = useColors();
  return (
    <Pressable style={[styles.row, { backgroundColor: c.card }]} onPress={onPress}>
      <Text style={[styles.rowTitle, { color: danger ? c.expense : c.text }]}>{title}</Text>
      <View style={styles.rowEnd}>
        {hint ? <Text style={{ color: c.textDim, marginRight: 6 }}>{hint}</Text> : null}
        <Text style={{ color: c.textDim, fontSize: 18 }}>›</Text>
      </View>
    </Pressable>
  );
};

export const MeScreen = () => {
  const c = useColors();
  const navigation = useNavigation<any>();
  const { transactions, categories } = useStore();
  const sessionUser = useSession((s) => s.user);
  const logout = useSession((s) => s.logout);

  const onLogout = () => {
    Alert.alert('退出登录', '确定要退出当前账号吗？', [
      { text: '取消', style: 'cancel' },
      { text: '退出', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const summary = useMemo(() => {
    const total = transactions.length;
    const days = new Set(transactions.map((t) => t.date.slice(0, 10))).size;
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    }
    return { total, days, income, expense };
  }, [transactions]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={[styles.profile, { backgroundColor: c.card }]}>
          <View style={[styles.avatar, { backgroundColor: c.primary }]}>
            <Text style={styles.avatarText}>记</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: c.text }]}>
              {sessionUser?.phone ?? '记账小本'}
            </Text>
            <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 4 }}>
              共 {summary.total} 笔记录 · 记账 {summary.days} 天
            </Text>
          </View>
          <Pressable
            style={[styles.logoutBtn, { borderColor: c.expense }]}
            onPress={onLogout}
            hitSlop={8}
          >
            <Text style={{ color: c.expense, fontSize: 13, fontWeight: '500' }}>退出</Text>
          </Pressable>
        </View>

        <View style={[styles.statsCard, { backgroundColor: c.card }]}>
          <View style={styles.statsCol}>
            <Text style={{ color: c.textDim, fontSize: 12 }}>累计支出</Text>
            <Text style={[styles.statsValue, { color: c.expense }]}>{formatCNY(summary.expense)}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <View style={styles.statsCol}>
            <Text style={{ color: c.textDim, fontSize: 12 }}>累计收入</Text>
            <Text style={[styles.statsValue, { color: c.income }]}>{formatCNY(summary.income)}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <View style={styles.statsCol}>
            <Text style={{ color: c.textDim, fontSize: 12 }}>累计结余</Text>
            <Text style={[styles.statsValue, { color: c.text }]}>
              {formatCNY(summary.income - summary.expense)}
            </Text>
          </View>
        </View>

        <Text style={[styles.section, { color: c.textMuted }]}>管理</Text>
        <Row
          title="分类管理"
          hint={`${categories.length} 个`}
          onPress={() => navigation.navigate('Categories')}
        />
        <Row title="预算设置" onPress={() => navigation.navigate('Budgets')} />

        <Text style={[styles.section, { color: c.textMuted }]}>设置</Text>
        <Row title="主题 / 数据" onPress={() => navigation.navigate('Settings')} />
        <Row title="关于" onPress={() => navigation.navigate('About')} />

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  profile: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  name: { fontSize: 16, fontWeight: '600' },
  statsCard: {
    flexDirection: 'row', borderRadius: 12, padding: 16, marginBottom: 12,
  },
  statsCol: { flex: 1, alignItems: 'center' },
  statsValue: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  divider: { width: StyleSheet.hairlineWidth, marginVertical: 4 },
  section: { fontSize: 12, marginTop: 12, marginBottom: 6, paddingHorizontal: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderRadius: 8, marginBottom: 6,
  },
  rowTitle: { fontSize: 15 },
  rowEnd: { flexDirection: 'row', alignItems: 'center' },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
});
