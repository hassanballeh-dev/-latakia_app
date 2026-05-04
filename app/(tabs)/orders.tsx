import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

export default function OrdersScreen() {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('orders.title')}</Text>
      <Text style={styles.hint}>Phase 3: order history</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  hint: { color: '#888' },
});
