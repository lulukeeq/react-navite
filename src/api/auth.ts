import { apiFetch } from './client';
import { SessionUser } from '../auth/tokenStore';

export type AuthResponse = {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
};

export const apiRegister = (phone: string, password: string) =>
  apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
    skipAuth: true,
  });

export const apiLogin = (phone: string, password: string) =>
  apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
    skipAuth: true,
  });
