import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { InvoicePreviewModal } from '@/components/invoice-preview-modal';
import { OrderTypeBadge } from '@/components/order-type-badge';
import { useOrderDetail } from '@/hooks/use-orders';
import { formatPrice, type Lang } from '@/lib/i18n';
import { buildInvoice, formatOrderNumber, printInvoice, type Invoice } from '@/lib/printer';
import type { InvoiceLang, OrderItem } from '@/lib/supabase';
import { theme } from '@/lib/theme';

function formatDateTime(iso: string, lang: Lang): string {
  try {
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'nl-NL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const lang = (i18n.language as Lang) ?? 'nl';
  const { order, items, loading, error } = useOrderDetail(id);
  const [reprinting, setReprinting] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  // Reprint language defaults to the order's original language but can be
  // flipped per reprint — sometimes the customer asks for the other language.
  const [reprintLang, setReprintLang] = useState<InvoiceLang | null>(null);
  const effectiveLang: InvoiceLang = reprintLang ?? order?.invoice_lang ?? 'nl';

  const buildCurrentInvoice = (overrideLang?: InvoiceLang): Invoice | null => {
    if (!order) return null;
    return buildInvoice({
      orderNumber: order.daily_number,
      orderDate: order.order_date,
      createdAt: order.created_at,
      orderType: order.order_type,
      lang: overrideLang ?? effectiveLang,
      subtotal: Number(order.subtotal),
      taxRate: Number(order.tax_rate),
      taxAmount: Number(order.tax_amount),
      total: Number(order.total),
      lines: items.map((it) => ({
        name_ar: it.name_ar_snapshot,
        name_nl: it.name_nl_snapshot,
        quantity: it.quantity,
        unit_price: Number(it.unit_price),
      })),
    });
  };

  const onReprint = async () => {
    if (!order || reprinting) return;
    setReprinting(true);
    try {
      const invoice = buildCurrentInvoice();
      if (!invoice) return;
      await printInvoice(invoice);
      setPreviewInvoice(invoice);
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? String(e));
    } finally {
      setReprinting(false);
    }
  };

  const onPreview = () => {
    const invoice = buildCurrentInvoice();
    if (invoice) setPreviewInvoice(invoice);
  };

  if (loading && !order) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{t('common.error')}</Text>
        <Text style={styles.errorBody}>{error ?? 'Not found'}</Text>
      </View>
    );
  }

  const taxPercent = Math.round(Number(order.tax_rate) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.maxWidth}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Header card */}
          <View style={styles.headerCard}>
            <View style={styles.headerTop}>
              <Text style={styles.orderNumber}>{formatOrderNumber(order.daily_number)}</Text>
              <OrderTypeBadge type={order.order_type} />
            </View>
            <Text style={styles.datetime}>{formatDateTime(order.created_at, lang)}</Text>
          </View>

          {/* Items */}
          <Text style={styles.sectionLabel}>{t('orders.items')}</Text>
          {items.map((it) => (
            <ItemRow key={it.id} item={it} lang={lang} />
          ))}

          {/* Breakdown */}
          <View style={styles.breakdown}>
            <BreakdownRow label={t('basket.subtotal')} value={formatPrice(Number(order.subtotal), lang)} />
            <BreakdownRow
              label={t('basket.tax', { percent: taxPercent })}
              value={formatPrice(Number(order.tax_amount), lang)}
            />
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('basket.total')}</Text>
              <Text style={styles.totalValue}>{formatPrice(Number(order.total), lang)}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.langLabel}>{t('orders.reprint_in')}</Text>
          <View style={styles.langRow}>
            <LangPill
              label="Nederlands"
              active={effectiveLang === 'nl'}
              onPress={() => setReprintLang('nl')}
            />
            <LangPill
              label="العربية"
              active={effectiveLang === 'ar'}
              onPress={() => setReprintLang('ar')}
            />
          </View>
          <View style={styles.footerRow}>
            <Pressable
              onPress={onPreview}
              style={({ pressed }) => [styles.preview, pressed && styles.previewPressed]}>
              <Text style={styles.previewText}>{t('invoice.preview')}</Text>
            </Pressable>
            <Pressable
              onPress={onReprint}
              disabled={reprinting}
              style={({ pressed }) => [styles.reprint, (pressed || reprinting) && styles.reprintPressed]}>
              {reprinting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.reprintText}>{t('orders.reprint')}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
      <InvoicePreviewModal visible={!!previewInvoice} invoice={previewInvoice} onClose={() => setPreviewInvoice(null)} />
    </View>
  );
}

function LangPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.langPill, active && styles.langPillActive]}>
      <Text style={[styles.langPillLabel, active && styles.langPillLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function ItemRow({ item, lang }: { item: OrderItem; lang: Lang }) {
  const name = lang === 'ar' ? item.name_ar_snapshot : item.name_nl_snapshot;
  const lineTotal = Number(item.unit_price) * item.quantity;
  return (
    <View style={styles.itemRow}>
      <View style={styles.itemMain}>
        <Text style={styles.itemName} numberOfLines={2}>{name}</Text>
        <Text style={styles.itemUnit}>
          {formatPrice(Number(item.unit_price), lang)} × {item.quantity}
        </Text>
      </View>
      <Text style={styles.itemTotal}>{formatPrice(lineTotal, lang)}</Text>
    </View>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center' },
  maxWidth: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? theme.webMaxWidth : undefined,
  },
  scroll: { padding: 14, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: theme.colors.bg },
  error: { fontSize: 18, fontWeight: '700', color: theme.colors.danger, marginBottom: 8 },
  errorBody: { color: theme.colors.muted, textAlign: 'center' },

  headerCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
    gap: 8,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { fontSize: 28, fontWeight: '800', color: theme.colors.primary },
  datetime: { fontSize: 14, color: theme.colors.muted },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginStart: 4,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  itemMain: { flex: 1, paddingEnd: 12, gap: 4 },
  itemName: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  itemUnit: { fontSize: 13, color: theme.colors.muted },
  itemTotal: { fontSize: 16, fontWeight: '700', color: theme.colors.primary },

  breakdown: {
    marginTop: 12,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 6,
    ...theme.shadow.card,
  },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownLabel: { fontSize: 15, color: theme.colors.muted },
  breakdownValue: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 6 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  totalValue: { fontSize: 24, fontWeight: '800', color: theme.colors.primary },

  footer: {
    padding: 14,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 12,
  },
  langLabel: { fontSize: 13, fontWeight: '700', color: theme.colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  langRow: { flexDirection: 'row', gap: 10 },
  langPill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  langPillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primaryDark },
  langPillLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.primaryDark },
  langPillLabelActive: { color: '#fff' },
  footerRow: { flexDirection: 'row', gap: 10 },
  preview: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    backgroundColor: theme.colors.primarySoft,
    justifyContent: 'center',
  },
  previewPressed: { backgroundColor: theme.colors.primary },
  previewText: { color: theme.colors.primaryDark, fontSize: 15, fontWeight: '800' },
  reprint: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    ...theme.shadow.fab,
  },
  reprintPressed: { backgroundColor: theme.colors.primaryDark },
  reprintText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
});
