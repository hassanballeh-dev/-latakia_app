import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Platform, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { BasketFab } from '@/components/basket-fab';
import { CategoryPills } from '@/components/category-pills';
import { MenuItemCard } from '@/components/menu-item-card';
import { useMenu } from '@/hooks/use-menu';
import { useBasket } from '@/lib/basket';
import { theme } from '@/lib/theme';

export default function MenuScreen() {
  const { t } = useTranslation();
  const { categories, items, loading, error, reload } = useMenu();
  const add = useBasket((s) => s.add);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const selectedId = activeCategoryId ?? categories[0]?.id ?? null;

  const visibleItems = useMemo(
    () => (selectedId ? items.filter((i) => i.category_id === selectedId) : []),
    [items, selectedId],
  );

  if (loading && categories.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} />
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
      <View style={styles.maxWidth}>
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
          refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={theme.colors.primary} />}
          ListEmptyComponent={
            <Text style={styles.empty}>{t('menu.empty')}</Text>
          }
        />
      </View>
      <BasketFab />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center' },
  // On web, cap the content width so the layout doesn't stretch on a desktop browser.
  maxWidth: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? theme.webMaxWidth : undefined,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: theme.colors.bg },
  loading: { marginTop: 12, color: theme.colors.muted },
  error: { fontSize: 18, fontWeight: '700', color: theme.colors.danger, marginBottom: 8 },
  errorBody: { color: theme.colors.muted, textAlign: 'center' },
  grid: { padding: 8, paddingBottom: 140 },
  empty: { textAlign: 'center', padding: 32, color: theme.colors.muted, fontSize: 16 },
});
