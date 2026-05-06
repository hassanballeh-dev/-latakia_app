import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/lib/theme';

import { DatePicker } from './date-picker';

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type Props = {
  value: string | null; // 'YYYY-MM-DD' or null = all
  onChange: (value: string | null) => void;
};

export function DateFilter({ value, onChange }: Props) {
  const { t } = useTranslation();
  const today = todayIso();
  const isAll = value === null;
  const isToday = value === today;
  const isCustom = !isAll && !isToday;

  return (
    <View style={styles.bar}>
      <Chip label={t('orders.all')} active={isAll} onPress={() => onChange(null)} />
      <Chip label={t('orders.today')} active={isToday} onPress={() => onChange(today)} />
      {/* Always show the actual selected date in the picker so the waiter can
          see what's filtered. The chip + outline highlight indicate which
          shortcut applies. */}
      <View style={isCustom ? styles.activeWrap : undefined}>
        <DatePicker value={value} onChange={onChange} placeholder={t('orders.pick_date')} />
      </View>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primarySoft,
  },
  chipActive: { backgroundColor: theme.colors.primary },
  chipLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.primaryDark },
  chipLabelActive: { color: '#fff' },
  activeWrap: { borderRadius: theme.radius.pill, borderWidth: 2, borderColor: theme.colors.primary },
});
