import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { localizedName, type Lang } from '@/lib/i18n';
import type { Category } from '@/lib/supabase';

type Props = {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function CategoryPills({ categories, selectedId, onSelect }: Props) {
  const { i18n } = useTranslation();
  const lang = (i18n.language as Lang) ?? 'nl';

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {categories.map((c) => {
        const active = c.id === selectedId;
        return (
          <Pressable
            key={c.id}
            onPress={() => onSelect(c.id)}
            style={[styles.pill, active && styles.pillActive]}>
            <Text style={[styles.label, active && styles.labelActive]}>
              {localizedName(c, lang)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#eee',
  },
  pillActive: { backgroundColor: '#0a7ea4' },
  label: { fontSize: 16, fontWeight: '600', color: '#333' },
  labelActive: { color: '#fff' },
});
