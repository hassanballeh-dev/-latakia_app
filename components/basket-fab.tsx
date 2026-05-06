import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useBasket } from '@/lib/basket';
import { formatPrice, type Lang } from '@/lib/i18n';
import { theme } from '@/lib/theme';

// Floating basket button. Hidden when the basket is empty.
// Uses `end:` instead of `right:` so it flips to the left edge under RTL.
export function BasketFab() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const lang = (i18n.language as Lang) ?? 'nl';
  const count = useBasket((s) => s.itemCount());
  const total = useBasket((s) => s.total());

  if (count === 0) return null;

  return (
    <Pressable
      onPress={() => router.push('/basket')}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
      accessibilityLabel={t('basket.open')}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{count}</Text>
      </View>
      <Text style={styles.label}>{t('basket.title')}</Text>
      <Text style={styles.total}>{formatPrice(total, lang)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 28,
    end: 28,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: theme.radius.pill,
    gap: 14,
    ...theme.shadow.fab,
  },
  pressed: { backgroundColor: theme.colors.primaryDark },
  badge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  badgeText: { color: theme.colors.primary, fontWeight: '800', fontSize: 14 },
  label: { color: '#fff', fontSize: 16, fontWeight: '700' },
  total: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
