import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../auth/sessionStore';
import { useColors } from '../colors';
import { API_BASE_URL } from '../config';

type Mode = 'login' | 'register';

export const AuthScreen = () => {
  const c = useColors();
  const { register, login, busy, error, clearError } = useSession();
  const [mode, setMode] = useState<Mode>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [phoneFocus, setPhoneFocus] = useState(false);
  const [pwdFocus, setPwdFocus] = useState(false);

  const submit = async () => {
    clearError();
    const trimmed = phone.trim();
    if (!/^\+?\d{6,20}$/.test(trimmed)) {
      useSession.setState({ error: '手机号格式不正确' });
      return;
    }
    if (password.length < 6) {
      useSession.setState({ error: '密码至少 6 位' });
      return;
    }
    try {
      if (mode === 'register') await register(trimmed, password);
      else await login(trimmed, password);
    } catch {
      // surfaced via session.error
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={[styles.logo, { backgroundColor: c.primary }]}>
              <Text style={styles.logoText}>记</Text>
            </View>
            <Text style={[styles.title, { color: c.text }]}>记账小本</Text>
            <Text style={[styles.subtitle, { color: c.textMuted }]}>
              云端同步，多端可用
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: c.card, shadowColor: '#000' }]}>
            <View style={[styles.tabs, { backgroundColor: c.bg }]}>
              {(['login', 'register'] as const).map((m) => {
                const active = mode === m;
                return (
                  <Pressable
                    key={m}
                    style={[
                      styles.tab,
                      active && {
                        backgroundColor: c.card,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.06,
                        shadowRadius: 2,
                        elevation: 1,
                      },
                    ]}
                    onPress={() => {
                      setMode(m);
                      clearError();
                    }}
                  >
                    <Text
                      style={{
                        color: active ? c.text : c.textMuted,
                        fontWeight: active ? '600' : '500',
                        fontSize: 15,
                      }}
                    >
                      {m === 'login' ? '登录' : '注册'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: c.textMuted }]}>手机号</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: c.text,
                    borderBottomColor: phoneFocus ? c.primary : c.border,
                  },
                ]}
                value={phone}
                onChangeText={setPhone}
                onFocus={() => setPhoneFocus(true)}
                onBlur={() => setPhoneFocus(false)}
                placeholder="请输入手机号"
                placeholderTextColor={c.textDim}
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: c.textMuted }]}>密码</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: c.text,
                    borderBottomColor: pwdFocus ? c.primary : c.border,
                  },
                ]}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPwdFocus(true)}
                onBlur={() => setPwdFocus(false)}
                placeholder="至少 6 位"
                placeholderTextColor={c.textDim}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={64}
              />
            </View>

            {error ? (
              <Text style={[styles.error, { color: c.expense }]}>{error}</Text>
            ) : <View style={styles.errorPlaceholder} />}

            <Pressable
              style={[
                styles.submit,
                { backgroundColor: c.primary, opacity: busy ? 0.6 : 1 },
              ]}
              onPress={submit}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>
                  {mode === 'login' ? '登录' : '注册并登录'}
                </Text>
              )}
            </Pressable>

            <Text style={[styles.tip, { color: c.textDim }]}>
              {mode === 'login' ? '首次使用？切到注册创建账号。' : '注册即代表同意将数据保存到服务器。'}
            </Text>
          </View>

          <Text style={[styles.endpoint, { color: c.textDim }]} numberOfLines={1}>
            服务地址：{API_BASE_URL}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
  },
  hero: { alignItems: 'center', marginBottom: 32 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: { color: '#fff', fontSize: 30, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: 0.5 },
  subtitle: { fontSize: 14, marginTop: 6 },
  card: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  field: { marginTop: 16 },
  label: { fontSize: 12, marginBottom: 6 },
  input: {
    fontSize: 16,
    paddingVertical: 8,
    borderBottomWidth: 1.5,
  },
  error: { fontSize: 12, marginTop: 14, minHeight: 16 },
  errorPlaceholder: { marginTop: 14, height: 16 },
  submit: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 1 },
  tip: { fontSize: 12, marginTop: 12, textAlign: 'center' },
  endpoint: { fontSize: 11, textAlign: 'center', marginTop: 24 },
});
