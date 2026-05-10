import 'react-native-url-polyfill/auto';
import { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, Theme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Text, View, StyleSheet, useColorScheme, ActivityIndicator } from 'react-native';
import { useStore } from './src/store';
import { useSession } from './src/auth/sessionStore';
import { palettes } from './src/colors';
import { HomeScreen } from './src/screens/HomeScreen';
import { EditScreen } from './src/screens/EditScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { MeScreen } from './src/screens/MeScreen';
import { CategoriesScreen } from './src/screens/CategoriesScreen';
import { BudgetsScreen } from './src/screens/BudgetsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { AboutScreen } from './src/screens/AboutScreen';
import { AuthScreen } from './src/screens/AuthScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabIcon = ({ label, color }: { label: string; color: string }) => (
  <View style={[styles.icon, { borderColor: color }]}>
    <Text style={{ color, fontSize: 11, fontWeight: '600' }}>{label}</Text>
  </View>
);

const Tabs = () => {
  const themeMode = useStore((s) => s.themeMode);
  const sys = useColorScheme();
  const palette = palettes[themeMode === 'system' ? (sys === 'dark' ? 'dark' : 'light') : themeMode];

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textDim,
        tabBarStyle: { backgroundColor: palette.tabBar, borderTopColor: palette.border },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '账单',
          tabBarIcon: ({ color }) => <TabIcon label="账" color={color} />,
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          title: '统计',
          tabBarIcon: ({ color }) => <TabIcon label="计" color={color} />,
        }}
      />
      <Tab.Screen
        name="Me"
        component={MeScreen}
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => <TabIcon label="我" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const buildTheme = (dark: boolean): Theme => {
  const base = dark ? DarkTheme : DefaultTheme;
  const p = palettes[dark ? 'dark' : 'light'];

  return {
    ...base,
    dark,
    colors: {
      ...base.colors,
      primary: p.primary,
      background: p.bg,
      card: p.card,
      text: p.text,
      border: p.border,
      notification: p.expense,
    },
  };
};

const SplashScreen = ({ background, color }: { background: string; color: string }) => (
  <View style={[styles.splash, { backgroundColor: background }]}>
    <ActivityIndicator color={color} />
  </View>
);

export default function App() {
  const themeMode = useStore((s) => s.themeMode);
  const sys = useColorScheme();
  const isDark = themeMode === 'system' ? sys === 'dark' : themeMode === 'dark';
  const navTheme = buildTheme(isDark);

  const status = useSession((s) => s.status);
  const userId = useSession((s) => s.user?.id ?? null);
  const hydrateSession = useSession((s) => s.hydrate);
  const setScope = useStore((s) => s.setScope);
  const hydrateTheme = useStore((s) => s.hydrateTheme);

  useEffect(() => {
    void hydrateSession();
    void hydrateTheme();
  }, [hydrateSession, hydrateTheme]);

  useEffect(() => {
    void setScope(userId);
  }, [userId, setScope]);

  if (status === 'loading') {
    return (
      <SafeAreaProvider>
        <SplashScreen background={navTheme.colors.background} color={navTheme.colors.primary} />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        {status === 'authed' ? (
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: navTheme.colors.card },
              headerTintColor: navTheme.colors.text,
              headerTitleStyle: { fontWeight: '600' },
            }}
          >
            <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen
              name="Edit"
              component={EditScreen}
              options={{ title: '记一笔', presentation: 'modal' }}
            />
            <Stack.Screen name="Categories" component={CategoriesScreen} options={{ title: '分类管理' }} />
            <Stack.Screen name="Budgets" component={BudgetsScreen} options={{ title: '预算' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: '设置' }} />
            <Stack.Screen name="About" component={AboutScreen} options={{ title: '关于' }} />
          </Stack.Navigator>
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Auth" component={AuthScreen} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
