import { supabase, type Category, type MenuItem, type Order, type OrderItem } from './supabase';

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

export async function createOrder(items: CreateOrderInput): Promise<Order> {
  const { data, error } = await supabase.rpc('create_order', { items });
  if (error) throw error;
  return data as Order;
}

export async function fetchOrders(opts?: { date?: string }): Promise<Order[]> {
  let q = supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (opts?.date) q = q.eq('order_date', opts.date);
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
