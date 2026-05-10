import { useColorScheme } from 'react-native';
import { useStore } from './store';

export type Palette = {
  bg: string;
  card: string;
  text: string;
  textMuted: string;
  textDim: string;
  border: string;
  primary: string;
  income: string;
  expense: string;
  tabBar: string;
  inputBg: string;
};

export const palettes: { light: Palette; dark: Palette } = {
  light: {
    bg: '#f5f5f7',
    card: '#ffffff',
    text: '#222222',
    textMuted: '#666666',
    textDim: '#999999',
    border: '#eeeeee',
    primary: '#3b82f6',
    income: '#2c9c4e',
    expense: '#d9534f',
    tabBar: '#ffffff',
    inputBg: '#ffffff',
  },
  dark: {
    bg: '#0b0b0d',
    card: '#1a1a1d',
    text: '#f0f0f2',
    textMuted: '#a0a0a8',
    textDim: '#6b6b73',
    border: '#26262b',
    primary: '#3b82f6',
    income: '#34d399',
    expense: '#f87171',
    tabBar: '#141416',
    inputBg: '#1a1a1d',
  },
};

export const useColors = (): Palette => {
  const themeMode = useStore((s) => s.themeMode);
  const sysScheme = useColorScheme();
  const effective =
    themeMode === 'system' ? (sysScheme === 'dark' ? 'dark' : 'light') : themeMode;
  return palettes[effective];
};
