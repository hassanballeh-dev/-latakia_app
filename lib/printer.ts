// Thermal printer placeholder. Real implementation is deferred until the
// printer brand/model is confirmed (Bluetooth or WiFi). Until then, this
// just console.logs the invoice payload so we can verify the data shape.
//
// When the real library is wired in, only THIS file should change — call
// sites import { printInvoice } and pass the same Invoice shape.

import { restaurantConfig } from './config';

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
  total: number;
  lines: InvoiceLine[];
  // Header strings come from config; printed in both languages.
  header: { ar: string; nl: string };
};

export async function printInvoice(invoice: Invoice): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('[printer:placeholder]', JSON.stringify(invoice, null, 2));
}

export function formatOrderNumber(n: number): string {
  return `#${String(n).padStart(3, '0')}`;
}

export function buildInvoice(args: {
  orderNumber: number;
  orderDate: string;
  createdAt: string;
  total: number;
  lines: InvoiceLine[];
}): Invoice {
  return {
    ...args,
    header: restaurantConfig.invoiceHeader,
  };
}
