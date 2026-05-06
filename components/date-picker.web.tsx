// Web date picker — uses native HTML <input type="date"> for the calendar
// popover, styled to match our pill buttons. The native version lives in
// date-picker.tsx; Metro auto-picks per platform.
import { theme } from '@/lib/theme';

type Props = {
  value: string | null; // 'YYYY-MM-DD'
  onChange: (value: string | null) => void;
  placeholder: string;
};

export function DatePicker({ value, onChange, placeholder }: Props) {
  return (
    <input
      type="date"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      placeholder={placeholder}
      style={{
        paddingInline: 14,
        paddingBlock: 9,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.colors.primarySoft,
        border: `1px solid ${theme.colors.primarySoft}`,
        fontSize: 14,
        fontWeight: 700,
        color: theme.colors.primaryDark,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    />
  );
}
