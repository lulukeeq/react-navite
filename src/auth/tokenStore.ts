import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY_ACCESS = 'bk_access_token';
const KEY_REFRESH = 'bk_refresh_token';
const KEY_USER = 'bk_session_user';

const isWeb = Platform.OS === 'web';

const get = (k: string): Promise<string | null> => {
  if (isWeb) {
    try {
      return Promise.resolve(window.localStorage.getItem(k));
    } catch {
      return Promise.resolve(null);
    }
  }
  return SecureStore.getItemAsync(k);
};

const set = async (k: string, v: string): Promise<void> => {
  if (isWeb) {
    try { window.localStorage.setItem(k, v); } catch {}
    return;
  }
  await SecureStore.setItemAsync(k, v);
};

const del = async (k: string): Promise<void> => {
  if (isWeb) {
    try { window.localStorage.removeItem(k); } catch {}
    return;
  }
  await SecureStore.deleteItemAsync(k);
};

export type SessionUser = { id: string; phone: string };

export const tokenStore = {
  getAccess: () => get(KEY_ACCESS),
  getRefresh: () => get(KEY_REFRESH),
  setTokens: async (access: string, refresh: string) => {
    await set(KEY_ACCESS, access);
    await set(KEY_REFRESH, refresh);
  },
  setAccess: (access: string) => set(KEY_ACCESS, access),
  getUser: async (): Promise<SessionUser | null> => {
    const raw = await get(KEY_USER);
    if (!raw) return null;
    try { return JSON.parse(raw) as SessionUser; } catch { return null; }
  },
  setUser: (u: SessionUser) => set(KEY_USER, JSON.stringify(u)),
  clear: async () => {
    await del(KEY_ACCESS);
    await del(KEY_REFRESH);
    await del(KEY_USER);
  },
};
