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
      Alert.alert('Notice', 'There is no data to export yet.');
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
        Alert.alert('Export failed', String(e?.message ?? e));
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
        await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Export ledger' });
      } else {
        Alert.alert('Saved', `File saved to:\n${path}`);
      }
    } catch (e: any) {
      Alert.alert('Export failed', String(e?.message ?? e));
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
        Alert.alert('Import failed', 'No valid records were found in the selected file.');
        return;
      }

      Alert.alert('Confirm import', `Detected ${items.length} records. Merge them into the current data?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Merge',
          onPress: async () => {
            await importTxs(items);
            Alert.alert('Done', `Imported ${items.length} records.`);
          },
        },
      ]);
    } catch (e: any) {
      Alert.alert('Import failed', String(e?.message ?? e));
    }
  };

  const onClear = () => {
    Alert.alert(
      'Clear data',
      'This will delete all transactions, custom categories, and budgets. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all',
          style: 'destructive',
          onPress: async () => {
            await clearAll();
            Alert.alert('Done', 'All local data has been cleared.');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={[styles.section, { color: c.textMuted }]}>Theme</Text>
        <View style={[styles.themeRow, { backgroundColor: c.card }]}>
          {(['system', 'light', 'dark'] as const).map((m: ThemeMode) => {
            const active = themeMode === m;
            const labels: Record<ThemeMode, string> = {
              system: 'System',
              light: 'Light',
              dark: 'Dark',
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

        <Text style={[styles.section, { color: c.textMuted }]}>Data</Text>
        <Pressable style={[styles.row, { backgroundColor: c.card }]} onPress={exportCSV}>
          <Text style={[styles.rowTitle, { color: c.text }]}>Export CSV</Text>
          <Text style={[styles.rowHint, { color: c.textDim }]}>{transactions.length} records</Text>
        </Pressable>
        <Pressable style={[styles.row, { backgroundColor: c.card }]} onPress={importCSV}>
          <Text style={[styles.rowTitle, { color: c.text }]}>Import CSV</Text>
          <Text style={[styles.rowHint, { color: c.textDim }]}>Merge into current data</Text>
        </Pressable>

        <Text style={[styles.section, { color: c.textMuted }]}>Danger Zone</Text>
        <Pressable style={[styles.row, { backgroundColor: c.card }]} onPress={onClear}>
          <Text style={[styles.rowTitle, { color: c.expense }]}>Clear all data</Text>
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
