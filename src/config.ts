import { Platform } from 'react-native';
import Constants from 'expo-constants';

const fromEnv = process.env.EXPO_PUBLIC_API_URL;

// Expo dev: hostUri is e.g. "192.168.1.10:8081" — the dev machine's LAN address.
// Real device on the same Wi-Fi can reach `http://192.168.1.10:3000`.
const expoHost = (() => {
  const raw =
    (Constants.expoConfig as any)?.hostUri ??
    (Constants as any).expoGoConfig?.hostUri ??
    (Constants as any).manifest2?.extra?.expoGo?.developer?.hostUri ??
    null;
  if (!raw || typeof raw !== 'string') return null;
  const host = raw.split(':')[0];
  return host && host !== 'localhost' && host !== '127.0.0.1' ? host : null;
})();

const fallback =
  expoHost
    ? `http://${expoHost}:3000`
    : Platform.select({
        android: 'http://10.0.2.2:3000',
        default: 'http://localhost:3000',
      });

export const API_BASE_URL = (fromEnv ?? fallback ?? 'http://localhost:3000').replace(/\/$/, '');
