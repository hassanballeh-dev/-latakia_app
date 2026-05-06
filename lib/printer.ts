// Thermal printer placeholder. Real implementation is deferred until the
// printer brand/model is confirmed (Bluetooth or WiFi). Until then, this
// just console.logs the formatted invoice text so we can verify the layout.
//
// When the real library is wired in, only THIS file should change — call
// sites import { printInvoice } and pass the same Invoice shape.

import { restaurantConfig } from './config';
import type { InvoiceLang, OrderType } from './supabase';

export type InvoiceLine = {
  name_ar: string;
  name_nl: string;
  quantity: number;
  unit_price: number;
};

export type Invoice = {
  orderNumber: number; // daily number, e.g. 1, 2, 3
  orderDate: string;   // 'YYYY-MM-DD'
  createdAt: string;   // ISO timestamp
  orderType: OrderType;
  lang: InvoiceLang;   // which language to render (chosen at order time)
  subtotal: number;
  taxRate: number;     // e.g. 0.12 or 0.06
  taxAmount: number;
  total: number;
  lines: InvoiceLine[];
  // Header strings come from config; we pick the right one based on lang.
  header: { ar: string; nl: string };
};

export async function printInvoice(invoice: Invoice): Promise<void> {
  const { formatInvoiceText } = await import('./invoice-format');
  // eslint-disable-next-line no-console
  console.log('[printer:placeholder] ----- BEGIN RECEIPT -----');
  // eslint-disable-next-line no-console
  console.log(formatInvoiceText(invoice));
  // eslint-disable-next-line no-console
  console.log('[printer:placeholder] ----- END RECEIPT -----');
}

export function formatOrderNumber(n: number): string {
  return `#${String(n).padStart(3, '0')}`;
}

export function buildInvoice(args: {
  orderNumber: number;
  orderDate: string;
  createdAt: string;
  orderType: OrderType;
  lang: InvoiceLang;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  lines: InvoiceLine[];
}): Invoice {
  return {
    ...args,
    header: restaurantConfig.invoiceHeader,
  };
}
