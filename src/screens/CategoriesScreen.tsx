import { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { Category, TransactionType } from '../types';
import { useColors } from '../colors';

type EditingCat = { id?: string; name: string; type: TransactionType };

export const CategoriesScreen = () => {
  const c = useColors();
  const { categories, addCategory, updateCategory, removeCategory } = useStore();
  const [filter, setFilter] = useState<TransactionType>('expense');
  const [editing, setEditing] = useState<EditingCat | null>(null);

  const filtered = categories.filter((cc) => cc.type === filter);

  const onSave = async () => {
    if (!editing) return;
    const name = editing.name.trim();
    if (!name) {
      Alert.alert('提示', '请输入分类名');
      return;
    }
    if (editing.id) {
      await updateCategory(editing.id, { name });
    } else {
      await addCategory({ name, type: editing.type });
    }
    setEditing(null);
  };

  const onDelete = async (cat: Category) => {
    Alert.alert('删除', `确定删除分类"${cat.name}"？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          const r = await removeCategory(cat.id);
          if (!r.ok) Alert.alert('无法删除', r.reason ?? '');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['bottom']}>
      <View style={[styles.tabs, { backgroundColor: c.border }]}>
        {(['expense', 'income'] as const).map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, filter === t && { backgroundColor: c.card }]}
            onPress={() => setFilter(t)}
          >
            <Text
              style={{
                color: filter === t ? c.text : c.textMuted,
                fontWeight: filter === t ? '600' : '400',
              }}
            >
              {t === 'expense' ? '支出' : '收入'}
            </Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {filtered.map((cat) => (
          <View key={cat.id} style={[styles.row, { backgroundColor: c.card }]}>
            <Text style={[styles.name, { color: c.text }]}>{cat.name}</Text>
            <View style={styles.actions}>
              <Pressable
                onPress={() => setEditing({ id: cat.id, name: cat.name, type: cat.type })}
                style={styles.actionBtn}
              >
                <Text style={[styles.actionText, { color: c.primary }]}>编辑</Text>
              </Pressable>
              <Pressable onPress={() => onDelete(cat)} style={styles.actionBtn}>
                <Text style={[styles.actionText, { color: c.expense }]}>删除</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>

      <Pressable
        style={[styles.addBtn, { backgroundColor: c.primary }]}
        onPress={() => setEditing({ name: '', type: filter })}
      >
        <Text style={styles.addBtnText}>+ 新增分类</Text>
      </Pressable>

      <Modal transparent visible={!!editing} animationType="fade" onRequestClose={() => setEditing(null)}>
        <Pressable style={styles.modalBg} onPress={() => setEditing(null)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: c.card }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: c.text }]}>
              {editing?.id ? '编辑分类' : '新增分类'}（{editing?.type === 'expense' ? '支出' : '收入'}）
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.bg, color: c.text, borderColor: c.border }]}
              value={editing?.name ?? ''}
              onChangeText={(v) => setEditing((p) => (p ? { ...p, name: v } : p))}
              placeholder="分类名"
              placeholderTextColor={c.textDim}
              autoFocus
            />
            <View style={styles.modalRow}>
              <Pressable style={styles.modalBtn} onPress={() => setEditing(null)}>
                <Text style={{ color: c.textMuted }}>取消</Text>
              </Pressable>
              <Pressable style={styles.modalBtn} onPress={onSave}>
                <Text style={{ color: c.primary, fontWeight: '600' }}>保存</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: {
    flexDirection: 'row', borderRadius: 8, padding: 4, margin: 16, marginBottom: 0,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderRadius: 8, marginBottom: 8,
  },
  name: { fontSize: 16 },
  actions: { flexDirection: 'row' },
  actionBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  actionText: { fontSize: 14 },
  addBtn: { margin: 16, padding: 14, borderRadius: 10, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  modalBg: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  modalCard: { width: '100%', borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 15 },
  modalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
  modalBtn: { paddingHorizontal: 16, paddingVertical: 8 },
});
