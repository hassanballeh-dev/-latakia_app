// Native date picker (iOS / Android). The web version is in date-picker.web.tsx
// — Metro auto-picks per platform.
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { theme } from '@/lib/theme';

type Props = {
  value: string | null; // 'YYYY-MM-DD' or null
  onChange: (value: string | null) => void;
  placeholder: string;
};

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function DatePicker({ value, onChange, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}>
        <Text style={styles.label}>{value ?? placeholder}</Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_event, date) => {
            setOpen(false);
            if (date) onChange(toIso(date));
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.primarySoft,
  },
  btnPressed: { backgroundColor: theme.colors.primary },
  label: { fontSize: 14, fontWeight: '700', color: theme.colors.primaryDark },
});
