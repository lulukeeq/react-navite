import { API_BASE_URL } from '../config';
import { tokenStore } from '../auth/tokenStore';

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

let onUnauthorized: () => void = () => {};
export const setUnauthorizedHandler = (cb: () => void) => {
  onUnauthorized = cb;
};

let refreshing: Promise<string | null> | null = null;

const refreshAccess = async (): Promise<string | null> => {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const refreshToken = await tokenStore.getRefresh();
      if (!refreshToken) return null;
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { accessToken: string };
      await tokenStore.setAccess(data.accessToken);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      setTimeout(() => {
        refreshing = null;
      }, 0);
    }
  })();
  return refreshing;
};

type Options = RequestInit & { skipAuth?: boolean };

const buildHeaders = async (skipAuth: boolean, init?: HeadersInit): Promise<Headers> => {
  const headers = new Headers(init);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (!skipAuth) {
    const token = await tokenStore.getAccess();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
};

export const apiFetch = async <T = unknown>(path: string, opts: Options = {}): Promise<T> => {
  const { skipAuth = false, headers: rawHeaders, ...rest } = opts;

  const url = `${API_BASE_URL}${path}`;
  let headers = await buildHeaders(skipAuth, rawHeaders);
  let res = await fetch(url, { ...rest, headers });

  if (res.status === 401 && !skipAuth) {
    const newAccess = await refreshAccess();
    if (newAccess) {
      headers = await buildHeaders(skipAuth, rawHeaders);
      res = await fetch(url, { ...rest, headers });
    } else {
      onUnauthorized();
      throw new ApiError(401, 'unauthorized');
    }
  }

  if (!res.ok) {
    let body: unknown;
    try { body = await res.json(); } catch { /* ignore */ }
    const msg =
      (body && typeof body === 'object' && 'message' in (body as any) && (body as any).message) ||
      res.statusText ||
      `HTTP ${res.status}`;
    const flatMsg = Array.isArray(msg) ? msg.join('; ') : String(msg);
    throw new ApiError(res.status, flatMsg, body);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
};
