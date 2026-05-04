import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { BasketFab } from '@/components/basket-fab';
import { CategoryPills } from '@/components/category-pills';
import { MenuItemCard } from '@/components/menu-item-card';
import { useMenu } from '@/hooks/use-menu';
import { useBasket } from '@/lib/basket';

export default function MenuScreen() {
  const { t } = useTranslation();
  const { categories, items, loading, error, reload } = useMenu();
  const add = useBasket((s) => s.add);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  // Default the active category to the first one once data loads.
  const selectedId = activeCategoryId ?? categories[0]?.id ?? null;

  const visibleItems = useMemo(
    () => (selectedId ? items.filter((i) => i.category_id === selectedId) : []),
    [items, selectedId],
  );

  if (loading && categories.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loading}>{t('menu.loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{t('common.error')}</Text>
        <Text style={styles.errorBody}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CategoryPills
        categories={categories}
        selectedId={selectedId}
        onSelect={setActiveCategoryId}
      />
      <FlatList
        data={visibleItems}
        keyExtractor={(i) => i.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => <MenuItemCard item={item} onPress={() => add(item)} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}
        ListEmptyComponent={
          <Text style={styles.empty}>{t('menu.empty')}</Text>
        }
      />
      <BasketFab />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f8' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loading: { marginTop: 12, color: '#666' },
  error: { fontSize: 18, fontWeight: '700', color: '#a33', marginBottom: 8 },
  errorBody: { color: '#666', textAlign: 'center' },
  grid: { padding: 6, paddingBottom: 120 },
  empty: { textAlign: 'center', padding: 32, color: '#888', fontSize: 16 },
});
