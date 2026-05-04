import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useBasket, type BasketLine } from '@/lib/basket';
import { createOrder } from '@/lib/db';
import { formatPrice, localizedName, type Lang } from '@/lib/i18n';
import { buildInvoice, formatOrderNumber, printInvoice } from '@/lib/printer';

export default function BasketScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const lang = (i18n.language as Lang) ?? 'nl';

  const lines = useBasket((s) => s.lines);
  const total = useBasket((s) => s.total());
  const setQuantity = useBasket((s) => s.setQuantity);
  const remove = useBasket((s) => s.remove);
  const clear = useBasket((s) => s.clear);

  const [submitting, setSubmitting] = useState(false);

  const onConfirm = async () => {
    if (lines.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      const order = await createOrder(
        lines.map((l) => ({ menu_item_id: l.menuItem.id, quantity: l.quantity })),
      );
      await printInvoice(
        buildInvoice({
          orderNumber: order.daily_number,
          orderDate: order.order_date,
          createdAt: order.created_at,
          total: Number(order.total),
          lines: lines.map((l) => ({
            name_ar: l.menuItem.name_ar,
            name_nl: l.menuItem.name_nl,
            quantity: l.quantity,
            unit_price: l.menuItem.price,
          })),
        }),
      );
      clear();
      Alert.alert(
        t('order.confirmed_title'),
        t('order.confirmed_body', { number: formatOrderNumber(order.daily_number) }),
        [{ text: t('order.ok'), onPress: () => router.back() }],
      );
    } catch (e: any) {
      Alert.alert(t('common.error'), t('order.save_error', { error: e?.message ?? String(e) }));
    } finally {
      setSubmitting(false);
    }
  };

  if (lines.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{t('basket.empty')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={lines}
        keyExtractor={(l) => l.menuItem.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <BasketRow
            line={item}
            lang={lang}
            onInc={() => setQuantity(item.menuItem.id, item.quantity + 1)}
            onDec={() => setQuantity(item.menuItem.id, item.quantity - 1)}
            onRemove={() => remove(item.menuItem.id)}
            removeLabel={t('basket.remove')}
          />
        )}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('basket.total')}</Text>
          <Text style={styles.totalValue}>{formatPrice(total, lang)}</Text>
        </View>
        <Pressable
          onPress={onConfirm}
          disabled={submitting}
          style={({ pressed }) => [
            styles.confirm,
            (pressed || submitting) && styles.confirmPressed,
          ]}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmText}>{t('basket.confirm')}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function BasketRow({
  line,
  lang,
  onInc,
  onDec,
  onRemove,
  removeLabel,
}: {
  line: BasketLine;
  lang: Lang;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.rowName} numberOfLines={2}>
          {localizedName(line.menuItem, lang)}
        </Text>
        <Text style={styles.rowUnit}>
          {formatPrice(line.menuItem.price, lang)} × {line.quantity}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowSubtotal}>
          {formatPrice(line.menuItem.price * line.quantity, lang)}
        </Text>
        <View style={styles.qtyControls}>
          <QtyBtn label="−" onPress={onDec} />
          <Text style={styles.qty}>{line.quantity}</Text>
          <QtyBtn label="+" onPress={onInc} />
        </View>
        <Pressable onPress={onRemove} hitSlop={8}>
          <Text style={styles.removeLink}>{removeLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function QtyBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.qtyBtn, pressed && styles.qtyBtnPressed]}
      hitSlop={6}>
      <Text style={styles.qtyBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f8' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  empty: { fontSize: 18, color: '#888' },
  list: { padding: 12, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e2e2',
  },
  rowMain: { flex: 1, justifyContent: 'space-between', paddingEnd: 12 },
  rowName: { fontSize: 17, fontWeight: '600' },
  rowUnit: { fontSize: 13, color: '#666', marginTop: 6 },
  rowRight: { alignItems: 'flex-end', gap: 8 },
  rowSubtotal: { fontSize: 17, fontWeight: '700', color: '#0a7ea4' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnPressed: { backgroundColor: '#ddd' },
  qtyBtnText: { fontSize: 22, fontWeight: '700', color: '#333' },
  qty: { fontSize: 16, fontWeight: '600', minWidth: 24, textAlign: 'center' },
  removeLink: { fontSize: 13, color: '#a33', fontWeight: '600' },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e2e2',
    gap: 12,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 18, fontWeight: '600' },
  totalValue: { fontSize: 22, fontWeight: '800', color: '#0a7ea4' },
  confirm: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmPressed: { backgroundColor: '#086687' },
  confirmText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
