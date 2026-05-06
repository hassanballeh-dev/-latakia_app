import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useAdminAuth } from '@/lib/admin-auth';
import { initI18n, loadStoredLanguage } from '@/lib/i18n';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const lang = await loadStoredLanguage();
      initI18n(lang);
      await useAdminAuth.getState().init();
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="basket" options={{ presentation: 'modal', title: 'Basket' }} />
        <Stack.Screen name="orders/[id]" options={{ title: 'Order' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
