import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import type { OrderType } from '@/lib/supabase';
import { theme } from '@/lib/theme';

export function OrderTypeBadge({ type }: { type: OrderType }) {
  const { t } = useTranslation();
  const label = type === 'dine_in' ? t('basket.dine_in_short') : t('basket.takeaway_short');
  const isTakeaway = type === 'takeaway';
  return (
    <View style={[styles.badge, isTakeaway ? styles.takeaway : styles.dineIn]}>
      <Text style={[styles.label, isTakeaway ? styles.takeawayLabel : styles.dineInLabel]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
  },
  dineIn: { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primary },
  takeaway: { backgroundColor: '#fff3da', borderColor: theme.colors.accent },
  label: { fontSize: 12, fontWeight: '700' },
  dineInLabel: { color: theme.colors.primaryDark },
  takeawayLabel: { color: '#a07014' },
});
