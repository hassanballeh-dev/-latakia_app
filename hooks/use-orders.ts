import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { fetchOrder, fetchOrderItems, fetchOrders } from '@/lib/db';
import type { Order, OrderItem } from '@/lib/supabase';

export function useOrders(dateFilter: string | null) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrders(dateFilter ? { date: dateFilter } : undefined);
      setOrders(data);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  // Refetch each time the screen comes back into focus (e.g. after confirming a new order).
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
