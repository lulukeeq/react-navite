import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../colors';

export const AboutScreen = () => {
  const c = useColors();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View style={[styles.logo, { backgroundColor: c.primary }]}>
          <Text style={styles.logoText}>记</Text>
        </View>
        <Text style={[styles.title, { color: c.text }]}>记账小本</Text>
        <Text style={[styles.version, { color: c.textMuted }]}>v0.1.0</Text>

        <View style={[styles.card, { backgroundColor: c.card }]}>
          <Text style={[styles.h, { color: c.text }]}>项目</Text>
          <Text style={[styles.p, { color: c.textMuted }]}>
            一个用来学习 React Native 的记账 app，使用 Expo + TypeScript + Zustand + AsyncStorage 实现，
            数据保存在本地。
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: c.card }]}>
          <Text style={[styles.h, { color: c.text }]}>功能</Text>
          <Text style={[styles.p, { color: c.textMuted }]}>
            • 记一笔（支出/收入），可选日期与分类{'\n'}
            • 长按交易记录可删除，点击进入编辑{'\n'}
            • 月份切换查看历史账单与统计{'\n'}
            • 自定义分类的增删改{'\n'}
            • 每月各分类预算与进度{'\n'}
            • 支出/收入饼图可视化{'\n'}
            • 浅色/深色主题切换{'\n'}
            • CSV 导出与导入
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: c.card }]}>
          <Text style={[styles.h, { color: c.text }]}>技术栈</Text>
          <Text style={[styles.p, { color: c.textMuted }]}>
            Expo · React Native · TypeScript · React Navigation · Zustand · AsyncStorage · react-native-svg
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  logo: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12,
  },
  logoText: { color: '#fff', fontSize: 24, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  version: { fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 24 },
  card: { borderRadius: 12, padding: 16, marginBottom: 12 },
  h: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  p: { fontSize: 14, lineHeight: 22 },
});
