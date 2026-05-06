import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatPrice, type Lang } from '@/lib/i18n';
import { formatOrderNumber } from '@/lib/printer';
import type { Order } from '@/lib/supabase';
import { theme } from '@/lib/theme';

import { OrderTypeBadge } from './order-type-badge';

function formatDateTime(iso: string, lang: Lang): string {
  const d = new Date(iso);
  try {
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'nl-NL', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

export function OrderRow({ order }: { order: Order }) {
  const router = useRouter();
  const { i18n } = useTranslation();
  const lang = (i18n.language as Lang) ?? 'nl';

  return (
    <Pressable
      onPress={() => router.push(`/orders/${order.id}`)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.left}>
        <Text style={styles.orderNumber}>{formatOrderNumber(order.daily_number)}</Text>
        <Text style={styles.datetime}>{formatDateTime(order.created_at, lang)}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.total}>{formatPrice(Number(order.total), lang)}</Text>
        <OrderTypeBadge type={order.order_type} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  pressed: { backgroundColor: theme.colors.primarySoft },
  left: { gap: 4 },
  orderNumber: { fontSize: 20, fontWeight: '800', color: theme.colors.primary },
  datetime: { fontSize: 13, color: theme.colors.muted },
  right: { alignItems: 'flex-end', gap: 8 },
  total: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
});
