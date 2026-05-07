import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';

import { ErrorBoundary } from '@/components/error-boundary';
import { useAdminAuth } from '@/lib/admin-auth';
import { initI18n, loadStoredLanguage } from '@/lib/i18n';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const lang = await loadStoredLanguage();
        initI18n(lang);
        await useAdminAuth.getState().init();
        setReady(true);
      } catch (e: any) {
        // Show the error on screen instead of staying on the loading spinner
        // forever (which looks like a black screen on dark-mode devices).
        setInitError(`${e?.message ?? String(e)}\n\n${e?.stack ?? ''}`);
      }
    })();
  }, []);

  if (initError) {
    return (
      <View style={styles.errBox}>
        <Text style={styles.errTitle}>Init Error</Text>
        <Text style={styles.errSubtitle}>Take a screenshot of this screen.</Text>
        <ScrollView style={styles.errScroll} contentContainerStyle={{ padding: 12 }}>
          <Text selectable style={styles.errText}>{initError}</Text>
        </ScrollView>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>LATAKIA</Text>
        <ActivityIndicator color="#c8553d" size="small" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="basket" options={{ presentation: 'modal', title: 'Basket' }} />
          <Stack.Screen name="orders/[id]" options={{ title: 'Order' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#faf6f0', gap: 24 },
  loadingText: { color: '#c8553d', fontSize: 42, fontWeight: '900', letterSpacing: 6 },
  errBox: { flex: 1, backgroundColor: '#fff', padding: 16, paddingTop: 60 },
  errTitle: { fontSize: 22, fontWeight: '800', color: '#a8341c', marginBottom: 4 },
  errSubtitle: { fontSize: 14, color: '#666', marginBottom: 12 },
  errScroll: { flex: 1, backgroundColor: '#fafafa', borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  errText: { fontSize: 12, fontFamily: 'monospace', color: '#000' },
});
