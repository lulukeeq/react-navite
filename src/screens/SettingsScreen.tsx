import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useStore } from '../store';
import { useColors } from '../colors';
import { ThemeMode } from '../types';
import { txsToCSV, csvToTxs } from '../utils';

const UTF8_BOM = '\uFEFF';

export const SettingsScreen = () => {
  const c = useColors();
  const { themeMode, setThemeMode, transactions, importTxs, clearAll } = useStore();

  const exportCSV = async () => {
    if (transactions.length === 0) {
      Alert.alert('\u63D0\u793A', '\u6682\u65E0\u6570\u636E\u53EF\u5BFC\u51FA');
      return;
    }

    const csv = txsToCSV(transactions);
    const filename = `bookkeeping-${new Date().toISOString().slice(0, 10)}.csv`;

    if (Platform.OS === 'web') {
      try {
        const blob = new Blob([UTF8_BOM + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (e: any) {
        Alert.alert('\u5BFC\u51FA\u5931\u8D25', String(e?.message ?? e));
      }
      return;
    }

    try {
      const path = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(path, UTF8_BOM + csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: '\u5BFC\u51FA\u8D26\u5355' });
      } else {
        Alert.alert('\u5DF2\u4FDD\u5B58', `\u6587\u4EF6\u5DF2\u4FDD\u5B58\u5230\uFF1A\n${path}`);
      }
    } catch (e: any) {
      Alert.alert('\u5BFC\u51FA\u5931\u8D25', String(e?.message ?? e));
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
      let content = '';

      if (Platform.OS === 'web') {
        const file: any = asset.file;
        content = file ? await file.text() : '';
      } else {
        content = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }

      const stripped = content.replace(/^\uFEFF/, '');
      const items = csvToTxs(stripped);
      if (items.length === 0) {
        Alert.alert('\u5BFC\u5165\u5931\u8D25', '\u672A\u8BC6\u522B\u5230\u6709\u6548\u8BB0\u5F55');
        return;
      }

      Alert.alert('\u786E\u8BA4\u5BFC\u5165', `\u8BC6\u522B\u5230 ${items.length} \u6761\u8BB0\u5F55\uFF0C\u662F\u5426\u5408\u5E76\u5230\u5F53\u524D\u6570\u636E\uFF1F`, [
        { text: '\u53D6\u6D88', style: 'cancel' },
        {
          text: '\u5408\u5E76',
          onPress: async () => {
            await importTxs(items);
            Alert.alert('\u5B8C\u6210', `\u5DF2\u5BFC\u5165 ${items.length} \u6761`);
          },
        },
      ]);
    } catch (e: any) {
      Alert.alert('\u5BFC\u5165\u5931\u8D25', String(e?.message ?? e));
    }
  };

  const onClear = () => {
    Alert.alert(
      '\u91CD\u7F6E\u672C\u5730\u6570\u636E',
      '\u5C06\u6E05\u7A7A\u672C\u5730\u7F13\u5B58\u5E76\u4ECE\u670D\u52A1\u5668\u91CD\u65B0\u62C9\u53D6\uFF08\u4E91\u7AEF\u6570\u636E\u4E0D\u53D7\u5F71\u54CD\uFF09\u3002',
      [
        { text: '\u53D6\u6D88', style: 'cancel' },
        {
          text: '\u786E\u8BA4\u91CD\u7F6E',
          style: 'destructive',
          onPress: async () => {
            await clearAll();
            Alert.alert('\u5B8C\u6210', '\u672C\u5730\u7F13\u5B58\u5DF2\u91CD\u7F6E\uFF0C\u6B63\u5728\u91CD\u65B0\u540C\u6B65');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={[styles.section, { color: c.textMuted }]}>主题</Text>
        <View style={[styles.themeRow, { backgroundColor: c.card }]}>
          {(['system', 'light', 'dark'] as const).map((m: ThemeMode) => {
            const active = themeMode === m;
            const labels: Record<ThemeMode, string> = {
              system: '跟随系统',
              light: '浅色',
              dark: '深色',
            };

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
          <Text style={[styles.rowHint, { color: c.textDim }]}>{transactions.length} 条记录</Text>
        </Pressable>
        <Pressable style={[styles.row, { backgroundColor: c.card }]} onPress={importCSV}>
          <Text style={[styles.rowTitle, { color: c.text }]}>导入 CSV</Text>
          <Text style={[styles.rowHint, { color: c.textDim }]}>合并到当前数据</Text>
        </Pressable>

        <Text style={[styles.section, { color: c.textMuted }]}>危险操作</Text>
        <Pressable style={[styles.row, { backgroundColor: c.card }]} onPress={onClear}>
          <Text style={[styles.rowTitle, { color: c.expense }]}>重置本地缓存</Text>
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
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 8,
    marginBottom: 6,
  },
  rowTitle: { fontSize: 15 },
  rowHint: { fontSize: 12 },
});
