import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { InvoicePreviewModal } from '@/components/invoice-preview-modal';
import { useBasket, type BasketLine } from '@/lib/basket';
import { APP_CONFIG } from '@/lib/config';
import { TAX_RATES, createOrder } from '@/lib/db';
import { formatPrice, localizedName, type Lang } from '@/lib/i18n';
import { buildInvoice, formatOrderNumber, printInvoice, type Invoice } from '@/lib/printer';
import type { InvoiceLang, OrderType } from '@/lib/supabase';
import { theme } from '@/lib/theme';

export default function BasketScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const lang = (i18n.language as Lang) ?? 'nl';

  const lines = useBasket((s) => s.lines);
  const subtotal = useBasket((s) => s.total());
  const setQuantity = useBasket((s) => s.setQuantity);
  const remove = useBasket((s) => s.remove);
  const clear = useBasket((s) => s.clear);

  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  // Default the invoice language to the configured default (NL — most
  // customers in NL want a Dutch receipt). Waiter can flip per-order.
  const [invoiceLang, setInvoiceLang] = useState<InvoiceLang>(APP_CONFIG.defaultInvoiceLanguage);
  const [submitting, setSubmitting] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [confirmedNumber, setConfirmedNumber] = useState<number | null>(null);

  const taxRate = TAX_RATES[orderType];
  const taxAmount = useMemo(() => Math.round(subtotal * taxRate * 100) / 100, [subtotal, taxRate]);
  const total = subtotal + taxAmount;
  const taxPercentLabel = Math.round(taxRate * 100);

  const onConfirm = async () => {
    if (lines.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      const order = await createOrder(
        lines.map((l) => ({ menu_item_id: l.menuItem.id, quantity: l.quantity })),
        orderType,
        invoiceLang,
      );
      const invoice = buildInvoice({
        orderNumber: order.daily_number,
        orderDate: order.order_date,
        createdAt: order.created_at,
        orderType: order.order_type,
        lang: order.invoice_lang,
        subtotal: Number(order.subtotal),
        taxRate: Number(order.tax_rate),
        taxAmount: Number(order.tax_amount),
        total: Number(order.total),
        lines: lines.map((l) => ({
          name_ar: l.menuItem.name_ar,
          name_nl: l.menuItem.name_nl,
          quantity: l.quantity,
          unit_price: l.menuItem.price,
        })),
      });
      await printInvoice(invoice);
      clear();
      setConfirmedNumber(order.daily_number);
      setPreviewInvoice(invoice);
    } catch (e: any) {
      Alert.alert(t('common.error'), t('order.save_error', { error: e?.message ?? String(e) }));
    } finally {
      setSubmitting(false);
    }
  };

  const onClosePreview = () => {
    const number = confirmedNumber;
    setPreviewInvoice(null);
    setConfirmedNumber(null);
    if (number !== null) {
      // Show the success toast as the preview closes, then return to menu.
      Alert.alert(
        t('order.confirmed_title'),
        t('order.confirmed_body', { number: formatOrderNumber(number) }),
        [{ text: t('order.ok'), onPress: () => router.back() }],
      );
    }
  };

  if (lines.length === 0 && !previewInvoice) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{t('basket.empty')}</Text>
        <InvoicePreviewModal visible={!!previewInvoice} invoice={previewInvoice} onClose={onClosePreview} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.maxWidth}>
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
          {/* Order type selector */}
          <Text style={styles.sectionLabel}>{t('basket.order_type')}</Text>
          <View style={styles.typeRow}>
            <TypePill
              label={`${t('basket.dine_in')} · ${Math.round(TAX_RATES.dine_in * 100)}%`}
              active={orderType === 'dine_in'}
              onPress={() => setOrderType('dine_in')}
            />
            <TypePill
              label={`${t('basket.takeaway')} · ${Math.round(TAX_RATES.takeaway * 100)}%`}
              active={orderType === 'takeaway'}
              onPress={() => setOrderType('takeaway')}
            />
          </View>

          {/* Invoice language selector */}
          <Text style={styles.sectionLabel}>{t('basket.invoice_lang')}</Text>
          <View style={styles.typeRow}>
            <TypePill
              label="Nederlands"
              active={invoiceLang === 'nl'}
              onPress={() => setInvoiceLang('nl')}
            />
            <TypePill
              label="العربية"
              active={invoiceLang === 'ar'}
              onPress={() => setInvoiceLang('ar')}
            />
          </View>

          {/* Breakdown */}
          <View style={styles.breakdown}>
            <BreakdownRow label={t('basket.subtotal')} value={formatPrice(subtotal, lang)} />
            <BreakdownRow
              label={t('basket.tax', { percent: taxPercentLabel })}
              value={formatPrice(taxAmount, lang)}
            />
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('basket.total')}</Text>
              <Text style={styles.totalValue}>{formatPrice(total, lang)}</Text>
            </View>
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
      <InvoicePreviewModal visible={!!previewInvoice} invoice={previewInvoice} onClose={onClosePreview} />
    </View>
  );
}

function TypePill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.typePill, active && styles.typePillActive]}>
      <Text style={[styles.typePillLabel, active && styles.typePillLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function BreakdownRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.breakdownRow}>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={styles.breakdownValue}>{value}</Text>
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
  container: { flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center' },
  maxWidth: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? theme.webMaxWidth : undefined,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: theme.colors.bg },
  empty: { fontSize: 18, color: theme.colors.muted },

  list: { padding: 14, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  rowMain: { flex: 1, justifyContent: 'space-between', paddingEnd: 12 },
  rowName: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  rowUnit: { fontSize: 13, color: theme.colors.muted, marginTop: 6 },
  rowRight: { alignItems: 'flex-end', gap: 10 },
  rowSubtotal: { fontSize: 18, fontWeight: '800', color: theme.colors.primary },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnPressed: { backgroundColor: theme.colors.primary },
  qtyBtnText: { fontSize: 22, fontWeight: '800', color: theme.colors.primaryDark },
  qty: { fontSize: 16, fontWeight: '700', minWidth: 24, textAlign: 'center', color: theme.colors.text },
  removeLink: { fontSize: 13, color: theme.colors.danger, fontWeight: '700' },

  footer: {
    padding: 18,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 16,
  },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typePill: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typePillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primaryDark },
  typePillLabel: { fontSize: 15, fontWeight: '700', color: theme.colors.primaryDark },
  typePillLabelActive: { color: '#fff' },

  breakdown: { gap: 6 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownLabel: { fontSize: 15, color: theme.colors.muted },
  breakdownValue: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 6 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  totalValue: { fontSize: 24, fontWeight: '800', color: theme.colors.primary },

  confirm: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    ...theme.shadow.fab,
  },
  confirmPressed: { backgroundColor: theme.colors.primaryDark },
  confirmText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.3 },
});
