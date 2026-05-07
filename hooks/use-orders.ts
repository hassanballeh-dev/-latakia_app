import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { fetchOrder, fetchOrderItems, fetchOrders } from '@/lib/db';
import type { Order, OrderItem } from '@/lib/supabase';

export type DateRange = { from: string | null; to: string | null };

export function useOrders(range: DateRange) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrders({
        dateFrom: range.from ?? undefined,
        dateTo: range.to ?? undefined,
      });
      setOrders(data);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  // Refetch each time the screen comes back into focus.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { orders, loading, error, reload };
}

export function useOrderDetail(orderId: string | undefined) {
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const [o, oItems] = await Promise.all([
        fetchOrder(orderId),
        fetchOrderItems(orderId),
      ]);
      setOrder(o);
      setItems(oItems);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { order, items, loading, error, reload };
}
