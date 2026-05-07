import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Platform, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { DateFilter } from '@/components/date-filter';
import { OrderRow } from '@/components/order-row';
import { useOrders, type DateRange } from '@/hooks/use-orders';
import { theme } from '@/lib/theme';

export default function OrdersScreen() {
  const { t } = useTranslation();
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  const { orders, loading, error, reload } = useOrders(range);

  return (
    <View style={styles.container}>
      <View style={styles.maxWidth}>
        <DateFilter value={range} onChange={setRange} />
        {error ? (
          <View style={styles.center}>
            <Text style={styles.error}>{t('common.error')}</Text>
            <Text style={styles.errorBody}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(o) => o.id}
            renderItem={({ item }) => <OrderRow order={item} />}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={theme.colors.primary} />}
            ListEmptyComponent={
              loading ? (
                <ActivityIndicator color={theme.colors.primary} style={styles.loading} />
              ) : (
                <Text style={styles.empty}>{t('orders.empty')}</Text>
              )
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center' },
  maxWidth: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? theme.webMaxWidth : undefined,
  },
  list: { padding: 14, paddingBottom: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { fontSize: 18, fontWeight: '700', color: theme.colors.danger, marginBottom: 8 },
  errorBody: { color: theme.colors.muted, textAlign: 'center' },
  loading: { marginTop: 40 },
  empty: { textAlign: 'center', padding: 32, color: theme.colors.muted, fontSize: 16 },
});
