import { supabase, type Category, type InvoiceLang, type MenuItem, type Order, type OrderItem, type OrderType } from './supabase';

// Tax rates are also defined in the create_order Postgres function (server-authoritative).
// Duplicated here only so the basket UI can show a live preview before submit.
export const TAX_RATES: Record<OrderType, number> = {
  dine_in: 0.12,
  takeaway: 0.06,
};

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchMenuItems(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export type CreateOrderInput = { menu_item_id: string; quantity: number }[];

export async function createOrder(
  items: CreateOrderInput,
  order_type: OrderType,
  invoice_lang: InvoiceLang,
): Promise<Order> {
  const { data, error } = await supabase.rpc('create_order', { items, order_type, invoice_lang });
  if (error) throw error;
  return data as Order;
}

export async function fetchOrder(id: string): Promise<Order | null> {
  const { data, error } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as Order) ?? null;
}

export async function fetchOrders(opts?: {
  date?: string;       // single day (YYYY-MM-DD)
  dateFrom?: string;   // range start, inclusive
  dateTo?: string;     // range end, inclusive
}): Promise<Order[]> {
  let q = supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (opts?.date) q = q.eq('order_date', opts.date);
  if (opts?.dateFrom) q = q.gte('order_date', opts.dateFrom);
  if (opts?.dateTo) q = q.lte('order_date', opts.dateTo);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function fetchOrderItems(orderId: string): Promise<OrderItem[]> {
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);
  if (error) throw error;
  return data ?? [];
}

// ----- Admin CRUD -----

export async function createCategory(input: { name_ar: string; name_nl: string }): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ ...input, sort_order: 999 })
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function updateCategory(
  id: string,
  input: { name_ar: string; name_nl: string },
): Promise<void> {
  const { error } = await supabase.from('categories').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

export async function createMenuItem(input: {
  category_id: string;
  name_ar: string;
  name_nl: string;
  price: number;
  is_available: boolean;
}): Promise<MenuItem> {
  const { data, error } = await supabase
    .from('menu_items')
    .insert({ ...input, sort_order: 999 })
    .select()
    .single();
  if (error) throw error;
  return data as MenuItem;
}

export async function updateMenuItem(
  id: string,
  input: {
    category_id: string;
    name_ar: string;
    name_nl: string;
    price: number;
    is_available: boolean;
  },
): Promise<void> {
  const { error } = await supabase.from('menu_items').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteMenuItem(id: string): Promise<void> {
  const { error } = await supabase.from('menu_items').delete().eq('id', id);
  if (error) throw error;
}
