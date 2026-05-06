import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatPrice, localizedName, type Lang } from '@/lib/i18n';
import type { MenuItem } from '@/lib/supabase';
import { theme } from '@/lib/theme';

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
    margin: 8,
    padding: 18,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 120,
    justifyContent: 'space-between',
    ...theme.shadow.card,
  },
  cardPressed: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  cardDisabled: { opacity: 0.5 },
  name: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  price: { fontSize: 22, fontWeight: '800', color: theme.colors.primary },
  unavailable: { fontSize: 12, color: theme.colors.danger, fontWeight: '700' },
});
