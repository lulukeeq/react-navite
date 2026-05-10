import { create } from 'zustand';
import { tokenStore, SessionUser } from './tokenStore';
import { apiLogin, apiRegister } from '../api/auth';
import { setUnauthorizedHandler } from '../api/client';
import { useStore } from '../store';

export type SessionStatus = 'loading' | 'authed' | 'guest';

type SessionState = {
  user: SessionUser | null;
  status: SessionStatus;
  error: string | null;
  busy: boolean;
  hydrate: () => Promise<void>;
  register: (phone: string, password: string) => Promise<void>;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

export const useSession = create<SessionState>((set) => ({
  user: null,
  status: 'loading',
  error: null,
  busy: false,

  hydrate: async () => {
    const [access, user] = await Promise.all([
      tokenStore.getAccess(),
      tokenStore.getUser(),
    ]);
    if (access) {
      set({ user, status: 'authed' });
    } else {
      set({ user: null, status: 'guest' });
    }
  },

  register: async (phone, password) => {
    set({ busy: true, error: null });
    try {
      const r = await apiRegister(phone, password);
      await tokenStore.setTokens(r.accessToken, r.refreshToken);
      await tokenStore.setUser(r.user);
      set({ user: r.user, status: 'authed', busy: false });
    } catch (e: any) {
      set({ busy: false, error: e?.message ?? 'register failed' });
      throw e;
    }
  },

  login: async (phone, password) => {
    set({ busy: true, error: null });
    try {
      const r = await apiLogin(phone, password);
      await tokenStore.setTokens(r.accessToken, r.refreshToken);
      await tokenStore.setUser(r.user);
      set({ user: r.user, status: 'authed', busy: false });
    } catch (e: any) {
      set({ busy: false, error: e?.message ?? 'login failed' });
      throw e;
    }
  },

  logout: async () => {
    await tokenStore.clear();
    set({ user: null, status: 'guest', error: null, busy: false });
    await useStore.getState().setScope(null);
  },

  clearError: () => set({ error: null }),
}));

setUnauthorizedHandler(() => {
  void useSession.getState().logout();
});
