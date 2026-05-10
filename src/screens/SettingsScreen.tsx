import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useStore } from '../store';
import { useColors } from '../colors';
import { ThemeMode } from '../types';
import { txsToCSV, csvToTxs } from '../utils';

export const SettingsScreen = () => {
  const c = useColors();
  const { themeMode, setThemeMode, transactions, importTxs, clearAll } = useStore();

  const exportCSV = async () => {
    if (transactions.length === 0) {
      Alert.alert('提示', '暂无数据可导出');
      return;
    }
    const csv = txsToCSV(transactions);
    const filename = `bookkeeping-${new Date().toISOString().slice(0, 10)}.csv`;

    if (Platform.OS === 'web') {
      try {
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (e: any) {
        Alert.alert('导出失败', String(e?.message ?? e));
      }
      return;
    }

    try {
      const path = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(path, '﻿' + csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: '导出账单' });
      } else {
        Alert.alert('已保存', `文件已保存到：\n${path}`);
      }
    } catch (e: any) {
      Alert.alert('导出失败', String(e?.message ?? e));
    }
  };

  const importCSV = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', '*/*'],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.[0]) return;
      const asset = res.assets[0];
      let content: string;
      if (Platform.OS === 'web') {
        const file: any = asset.file;
        content = file ? await file.text() : '';
      } else {
        content = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }
      const stripped = content.replace(/^﻿/, '');
      const items = csvToTxs(stripped);
      if (items.length === 0) {
        Alert.alert('导入失败', '未识别到有效记录');
        return;
      }
      Alert.alert('确认导入', `识别到 ${items.length} 条记录，是否合并到当前数据？`, [
        { text: '取消', style: 'cancel' },
        {
          text: '合并',
          onPress: async () => {
            await importTxs(items);
            Alert.alert('完成', `已导入 ${items.length} 条`);
          },
        },
      ]);
    } catch (e: any) {
      Alert.alert('导入失败', String(e?.message ?? e));
    }
  };

  const onClear = () => {
    Alert.alert('清空数据', '将删除所有交易、自定义分类、预算，无法恢复。', [
      { text: '取消', style: 'cancel' },
      {
        text: '确认清空',
        style: 'destructive',
        onPress: async () => {
          await clearAll();
          Alert.alert('已清空');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={[styles.section, { color: c.textMuted }]}>主题</Text>
        <View style={[styles.themeRow, { backgroundColor: c.card }]}>
          {(['system', 'light', 'dark'] as const).map((m: ThemeMode) => {
            const active = themeMode === m;
            const labels: Record<ThemeMode, string> = { system: '跟随系统', light: '浅色', dark: '深色' };
            return (
              <Pressable
                key={m}
                style={[
                  styles.themeBtn,
                  { backgroundColor: active ? c.primary : 'transparent', borderColor: c.border },
                ]}
                onPress={() => setThemeMode(m)}
              >
                <Text style={{ color: active ? '#fff' : c.text, fontWeight: active ? '600' : '400' }}>
                  {labels[m]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.section, { color: c.textMuted }]}>数据</Text>
        <Pressable style={[styles.row, { backgroundColor: c.card }]} onPress={exportCSV}>
          <Text style={[styles.rowTitle, { color: c.text }]}>导出 CSV</Text>
          <Text style={[styles.rowHint, { color: c.textDim }]}>
            {transactions.length} 条记录
          </Text>
        </Pressable>
        <Pressable style={[styles.row, { backgroundColor: c.card }]} onPress={importCSV}>
          <Text style={[styles.rowTitle, { color: c.text }]}>导入 CSV</Text>
          <Text style={[styles.rowHint, { color: c.textDim }]}>合并到当前</Text>
        </Pressable>

        <Text style={[styles.section, { color: c.textMuted }]}>危险操作</Text>
        <Pressable style={[styles.row, { backgroundColor: c.card }]} onPress={onClear}>
          <Text style={[styles.rowTitle, { color: c.expense }]}>清空所有数据</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { fontSize: 12, marginTop: 12, marginBottom: 6, paddingHorizontal: 4 },
  themeRow: { flexDirection: 'row', borderRadius: 10, padding: 6, gap: 6, marginBottom: 4 },
  themeBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6, borderWidth: 1,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderRadius: 8, marginBottom: 6,
  },
  rowTitle: { fontSize: 15 },
  rowHint: { fontSize: 12 },
});
