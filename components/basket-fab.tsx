import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useBasket } from '@/lib/basket';
import { formatPrice, type Lang } from '@/lib/i18n';

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
    bottom: 24,
    end: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  pressed: { backgroundColor: '#086687' },
  badge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#0a7ea4', fontWeight: '800', fontSize: 14 },
  label: { color: '#fff', fontSize: 16, fontWeight: '700' },
  total: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
