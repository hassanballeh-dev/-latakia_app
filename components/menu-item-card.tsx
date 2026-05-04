import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatPrice, localizedName, type Lang } from '@/lib/i18n';
import type { MenuItem } from '@/lib/supabase';

type Props = {
  item: MenuItem;
  onPress: () => void;
};

export function MenuItemCard({ item, onPress }: Props) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language as Lang) ?? 'nl';
  const disabled = !item.is_available;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.card,
        pressed && !disabled && styles.cardPressed,
        disabled && styles.cardDisabled,
      ]}>
      <Text style={styles.name} numberOfLines={2}>
        {localizedName(item, lang)}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.price}>{formatPrice(item.price, lang)}</Text>
        {disabled && <Text style={styles.unavailable}>{t('menu.unavailable')}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 160,
    margin: 6,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e2e2',
    minHeight: 110,
    justifyContent: 'space-between',
  },
  cardPressed: { backgroundColor: '#f0f7fb', borderColor: '#0a7ea4' },
  cardDisabled: { opacity: 0.5 },
  name: { fontSize: 18, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  price: { fontSize: 18, fontWeight: '700', color: '#0a7ea4' },
  unavailable: { fontSize: 12, color: '#a33', fontWeight: '600' },
});
