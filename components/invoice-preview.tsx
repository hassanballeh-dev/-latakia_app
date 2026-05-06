// Visual receipt component that mirrors the thermal-printer output.
// Renders ONE language — picked from invoice.lang.

import { Platform, StyleSheet, Text, View } from 'react-native';

import { formatOrderNumber, type Invoice } from '@/lib/printer';

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function money(n: number): string {
  return n.toFixed(2);
}

const LABELS = {
  nl: {
    order: 'Bestelling',
    type: { dine_in: 'In het restaurant', takeaway: 'Afhalen' },
    subtotal: 'Subtotaal',
    tax: (pct: number) => `BTW (${pct}%)`,
    total: 'TOTAAL',
    thanks: 'Bedankt!',
  },
  ar: {
    order: 'طلب',
    type: { dine_in: 'في المطعم', takeaway: 'سفري' },
    subtotal: 'المجموع الفرعي',
    tax: (pct: number) => `الضريبة (${pct}%)`,
    total: 'الإجمالي',
    thanks: 'شكراً',
  },
};

export function InvoicePreview({ invoice }: { invoice: Invoice }) {
  const lang = invoice.lang;
  const L = LABELS[lang];
  const isRtl = lang === 'ar';
  const orderNum = formatOrderNumber(invoice.orderNumber);
  const taxPct = Math.round(invoice.taxRate * 100);
  const dirStyle = isRtl ? styles.rtl : null;

  return (
    <View style={styles.receipt}>
      <Text style={[styles.bold, styles.center, styles.headerText]}>{invoice.header[lang]}</Text>

      <Divider char="=" />

      <View style={styles.row}>
        <Text style={[styles.line, dirStyle]}>{`${L.order} ${orderNum}`}</Text>
        <Text style={styles.line}>{L.type[invoice.orderType]}</Text>
      </View>
      <Text style={[styles.line, dirStyle]}>{formatDateTime(invoice.createdAt)}</Text>

      <Divider />

      {invoice.lines.map((l, i) => {
        const lineTotal = l.unit_price * l.quantity;
        const name = isRtl ? l.name_ar : l.name_nl;
        return (
          <View key={i} style={styles.itemBlock}>
            <Text style={[styles.line, dirStyle]}>{name}</Text>
            <View style={styles.row}>
              <Text style={styles.dim}>{`  ${l.quantity} × ${money(l.unit_price)}`}</Text>
              <Text style={styles.line}>{money(lineTotal)}</Text>
            </View>
          </View>
        );
      })}

      <Divider />

      <View style={styles.row}>
        <Text style={[styles.line, dirStyle]}>{L.subtotal}</Text>
        <Text style={styles.line}>{money(invoice.subtotal)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={[styles.line, dirStyle]}>{L.tax(taxPct)}</Text>
        <Text style={styles.line}>{money(invoice.taxAmount)}</Text>
      </View>

      <Divider />

      <View style={styles.row}>
        <Text style={[styles.line, styles.bold, styles.total, dirStyle]}>{L.total}</Text>
        <Text style={[styles.line, styles.bold, styles.total]}>{money(invoice.total)}</Text>
      </View>

      <Divider char="=" />

      <Text style={[styles.center, styles.bold, { marginTop: 8, fontSize: 14 }]}>{L.thanks}</Text>
    </View>
  );
}

function Divider({ char = '-' }: { char?: string }) {
  return <Text style={styles.divider}>{char.repeat(32)}</Text>;
}

const monoFont = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  web: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  default: 'monospace',
});

const styles = StyleSheet.create({
  receipt: {
    backgroundColor: '#fff',
    width: 360,
    maxWidth: '100%',
    paddingHorizontal: 14,
    paddingVertical: 18,
  },
  line: { fontFamily: monoFont, fontSize: 13, color: '#000' },
  bold: { fontWeight: '800' },
  center: { textAlign: 'center', fontFamily: monoFont, fontSize: 13, color: '#000' },
  rtl: { textAlign: 'right', writingDirection: 'rtl' },
  dim: { color: '#444', fontFamily: monoFont, fontSize: 12 },
  divider: { fontFamily: monoFont, fontSize: 13, color: '#000', letterSpacing: -0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  itemBlock: { marginBottom: 6 },
  headerText: { fontSize: 16, marginBottom: 4 },
  total: { fontSize: 16 },
});
