import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { localizedName, type Lang } from '@/lib/i18n';
import type { Category } from '@/lib/supabase';
import { theme } from '@/lib/theme';

type Props = {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function CategoryPills({ categories, selectedId, onSelect }: Props) {
  const { i18n } = useTranslation();
  const lang = (i18n.language as Lang) ?? 'nl';

  return (
    <View style={styles.bar}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  row: { paddingHorizontal: 12, paddingVertical: 14, gap: 10 },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryDark,
  },
  label: { fontSize: 16, fontWeight: '700', color: theme.colors.primaryDark },
  labelActive: { color: '#fff' },
});
