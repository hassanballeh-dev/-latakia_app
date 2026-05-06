import { useTranslation } from 'react-i18next';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Invoice } from '@/lib/printer';
import { theme } from '@/lib/theme';

import { InvoicePreview } from './invoice-preview';

type Props = {
  visible: boolean;
  invoice: Invoice | null;
  onClose: () => void;
};

// Opens a new browser window with the invoice rendered as monospace text and
// triggers the print dialog. Lets the user verify the layout on any USB or
// network printer they happen to have, ahead of the real thermal printer.
function browserPrint(invoice: Invoice) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  // Lazy require to keep this code path off mobile.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { formatInvoiceText } = require('@/lib/invoice-format');
  const text = formatInvoiceText(invoice) as string;
  const w = window.open('', '_blank', 'width=420,height=700');
  if (!w) return;
  w.document.write(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8" />
<title>Receipt</title>
<style>
  @page { margin: 4mm; }
  body { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
         font-size: 12px; white-space: pre; line-height: 1.3; padding: 8px; }
  @media print { body { font-size: 11px; } }
</style>
</head><body>${text.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!))}</body></html>`);
  w.document.close();
  // Some browsers need a tick to finish layout before print.
  setTimeout(() => w.print(), 100);
}

export function InvoicePreviewModal({ visible, invoice, onClose }: Props) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {invoice && <InvoicePreview invoice={invoice} />}
          <View style={styles.actions}>
            {Platform.OS === 'web' && invoice && (
              <Pressable
                onPress={() => browserPrint(invoice)}
                style={({ pressed }) => [styles.printBtn, pressed && styles.printBtnPressed]}>
                <Text style={styles.printText}>{t('orders.browser_print')}</Text>
              </Pressable>
            )}
            <Pressable onPress={onClose} style={({ pressed }) => [styles.close, pressed && styles.closePressed]}>
              <Text style={styles.closeText}>{t('invoice.close')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 16,
  },
  actions: { gap: 10, alignItems: 'stretch', width: '100%', maxWidth: 360 },
  printBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    ...theme.shadow.fab,
  },
  printBtnPressed: { backgroundColor: '#d8a040' },
  printText: { color: '#3a2a0a', fontSize: 16, fontWeight: '800' },
  close: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    ...theme.shadow.fab,
  },
  closePressed: { backgroundColor: theme.colors.primaryDark },
  closeText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
