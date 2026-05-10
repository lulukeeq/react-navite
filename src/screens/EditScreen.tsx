import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useStore } from '../store';
import { TransactionType } from '../types';
import { useColors } from '../colors';
import { formatDate } from '../utils';

export const EditScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editId: string | undefined = route.params?.id;
  const c = useColors();
  const { categories, transactions, addTx, updateTx, removeTx } = useStore();

  const editing = useMemo(
    () => (editId ? transactions.find((t) => t.id === editId) : undefined),
    [editId, transactions],
  );

  const [type, setType] = useState<TransactionType>(editing?.type ?? 'expense');
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [note, setNote] = useState(editing?.note ?? '');
  const [date, setDate] = useState<Date>(editing ? new Date(editing.date) : new Date());
  const [showPicker, setShowPicker] = useState(false);

  const filtered = useMemo(() => categories.filter((cc) => cc.type === type), [categories, type]);
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? filtered[0]?.id ?? '');

  useEffect(() => {
    navigation.setOptions({ title: editing ? '编辑记录' : '记一笔' });
  }, [editing, navigation]);

  const onChangeType = (t: TransactionType) => {
    setType(t);
    const list = categories.filter((cc) => cc.type === t);
    if (!list.find((cc) => cc.id === categoryId)) {
      setCategoryId(list[0]?.id ?? '');
    }
  };

  const onPickDate = (_e: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== 'ios') setShowPicker(false);
    if (selected) setDate(selected);
  };

  const submit = async () => {
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      Alert.alert('提示', '请输入有效金额');
      return;
    }
    if (!categoryId) {
      Alert.alert('提示', '请选择分类');
      return;
    }
    const payload = {
      type,
      amount: Math.round(num * 100) / 100,
      categoryId,
      note: note.trim(),
      date: date.toISOString(),
    };
    if (editing) {
      await updateTx(editing.id, payload);
    } else {
      await addTx(payload);
    }
    navigation.goBack();
  };

  const handleDelete = () => {
    if (!editing) return;
    Alert.alert('删除', '确定删除这条记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await removeTx(editing.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <View style={[styles.tabs, { backgroundColor: c.border }]}>
            {(['expense', 'income'] as const).map((t) => (
              <Pressable
                key={t}
                style={[styles.tab, type === t && { backgroundColor: c.card }]}
                onPress={() => onChangeType(t)}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: type === t ? c.text : c.textMuted, fontWeight: type === t ? '600' : '400' },
                  ]}
                >
                  {t === 'expense' ? '支出' : '收入'}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: c.textMuted }]}>金额</Text>
          <TextInput
            style={[styles.amountInput, { backgroundColor: c.inputBg, color: c.text }]}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={c.textDim}
            keyboardType="decimal-pad"
            autoFocus={!editing}
          />

          <Text style={[styles.label, { color: c.textMuted }]}>日期</Text>
          <Pressable
            style={[styles.dateBtn, { backgroundColor: c.inputBg }]}
            onPress={() => setShowPicker(true)}
          >
            <Text style={[styles.dateText, { color: c.text }]}>{formatDate(date.toISOString())}</Text>
          </Pressable>
          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onPickDate}
              maximumDate={new Date()}
            />
          )}

          <Text style={[styles.label, { color: c.textMuted }]}>分类</Text>
          <View style={styles.catGrid}>
            {filtered.map((cat) => {
              const active = categoryId === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.catChip,
                    { backgroundColor: active ? c.primary : c.card, borderColor: active ? c.primary : c.border },
                  ]}
                  onPress={() => setCategoryId(cat.id)}
                >
                  <Text style={{ color: active ? '#fff' : c.text, fontSize: 14 }}>{cat.name}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, { color: c.textMuted }]}>备注</Text>
          <TextInput
            style={[styles.noteInput, { backgroundColor: c.inputBg, color: c.text }]}
            value={note}
            onChangeText={setNote}
            placeholder="（可选）"
            placeholderTextColor={c.textDim}
            maxLength={50}
          />

          <Pressable style={[styles.submit, { backgroundColor: c.primary }]} onPress={submit}>
            <Text style={styles.submitText}>{editing ? '保存修改' : '保存'}</Text>
          </Pressable>

          {editing && (
            <Pressable style={[styles.deleteBtn]} onPress={handleDelete}>
              <Text style={[styles.deleteText, { color: c.expense }]}>删除此记录</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: { flexDirection: 'row', borderRadius: 8, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  tabText: { fontSize: 15 },
  label: { fontSize: 13, marginTop: 12, marginBottom: 6 },
  amountInput: { padding: 12, borderRadius: 8, fontSize: 32, fontWeight: '600' },
  dateBtn: { padding: 14, borderRadius: 8 },
  dateText: { fontSize: 15 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
  noteInput: { padding: 12, borderRadius: 8, fontSize: 15 },
  submit: { marginTop: 24, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  deleteBtn: { marginTop: 12, padding: 12, alignItems: 'center' },
  deleteText: { fontSize: 14 },
});
