// Plain-text formatter for thermal printers. ESC/POS printers accept raw
// text on an 80mm-wide roll (~32 monospace chars). The output is in ONE
// language — chosen at order time and stored on `orders.invoice_lang` so
// reprints stay consistent.

import type { Invoice } from './printer';

const WIDTH = 32;

function pad(left: string, right: string, width = WIDTH): string {
  const space = Math.max(1, width - left.length - right.length);
  return left + ' '.repeat(space) + right;
}

function center(text: string, width = WIDTH): string {
  const p = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(p) + text;
}

function divider(char = '-', width = WIDTH): string {
  return char.repeat(width);
}

function money(n: number): string {
  return n.toFixed(2);
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
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

export function formatInvoiceText(invoice: Invoice): string {
  const lang = invoice.lang;
  const L = LABELS[lang];
  const lines: string[] = [];
  const orderNumStr = `#${String(invoice.orderNumber).padStart(3, '0')}`;
  const taxPct = Math.round(invoice.taxRate * 100);

  lines.push(center(invoice.header[lang]));
  lines.push('');
  lines.push(divider('='));

  // Order info
  lines.push(pad(`${L.order} ${orderNumStr}`, L.type[invoice.orderType]));
  lines.push(formatDateTime(invoice.createdAt));
  lines.push(divider());

  for (const line of invoice.lines) {
    const lineTotal = line.unit_price * line.quantity;
    const name = lang === 'ar' ? line.name_ar : line.name_nl;
    lines.push(name);
    lines.push(pad(`  ${line.quantity} x ${money(line.unit_price)}`, money(lineTotal)));
    lines.push('');
  }

  lines.push(divider());
  lines.push(pad(L.subtotal, money(invoice.subtotal)));
  lines.push(pad(L.tax(taxPct), money(invoice.taxAmount)));
  lines.push(divider());
  lines.push(pad(L.total, money(invoice.total)));
  lines.push(divider('='));
  lines.push('');
  lines.push(center(L.thanks));
  lines.push('');

  return lines.join('\n');
}
