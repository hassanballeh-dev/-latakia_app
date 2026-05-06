import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { fetchCategories, fetchMenuItems } from '@/lib/db';
import type { Category, MenuItem } from '@/lib/supabase';

// Refetches whenever the screen comes back into focus, so admin edits are
// reflected the next time the waiter opens the Menu tab.
export function useMenu() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, mItems] = await Promise.all([fetchCategories(), fetchMenuItems()]);
      setCategories(cats);
      setItems(mItems);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { categories, items, loading, error, reload };
}
