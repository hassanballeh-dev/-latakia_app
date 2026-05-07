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

export type DateRange = { from: string | null; to: string | null };

type Props = {
  value: DateRange;
  onChange: (value: DateRange) => void;
};

// "Alle / Vandaag" quick chips + a Van / Tot range picker. The picker pair
// is the source of truth — chips are shortcuts that set both ends.
export function DateFilter({ value, onChange }: Props) {
  const { t } = useTranslation();
  const today = todayIso();
  const isAll = value.from === null && value.to === null;
  const isToday = value.from === today && value.to === today;

  return (
    <View style={styles.bar}>
      <View style={styles.chipsRow}>
        <Chip label={t('orders.all')} active={isAll} onPress={() => onChange({ from: null, to: null })} />
        <Chip label={t('orders.today')} active={isToday} onPress={() => onChange({ from: today, to: today })} />
      </View>

      <View style={styles.rangeRow}>
        <View style={styles.rangeItem}>
          <Text style={styles.rangeLabel}>{t('orders.from')}</Text>
          <DatePicker
            value={value.from}
            onChange={(from) => onChange({ ...value, from })}
            placeholder={t('orders.pick_date')}
          />
        </View>
        <View style={styles.rangeItem}>
          <Text style={styles.rangeLabel}>{t('orders.to')}</Text>
          <DatePicker
            value={value.to}
            onChange={(to) => onChange({ ...value, to })}
            placeholder={t('orders.pick_date')}
          />
        </View>
      </View>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  chipsRow: { flexDirection: 'row', gap: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primarySoft,
  },
  chipActive: { backgroundColor: theme.colors.primary },
  chipLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.primaryDark },
  chipLabelActive: { color: '#fff' },
  rangeRow: { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  rangeItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rangeLabel: { fontSize: 13, fontWeight: '700', color: theme.colors.muted, textTransform: 'uppercase' },
});
