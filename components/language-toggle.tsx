import * as Updates from 'expo-updates';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';

import { setLanguage, type Lang } from '@/lib/i18n';

// Header button: shows the OTHER language as the action label.
// On Arabic <-> Dutch toggle, RN needs an app reload to flip RTL — we trigger it.
export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const current = (i18n.language as Lang) ?? 'nl';
  const next: Lang = current === 'ar' ? 'nl' : 'ar';

  const onPress = async () => {
    const { rtlChanged } = await setLanguage(next);
    if (rtlChanged) {
      try {
        await Updates.reloadAsync();
      } catch {
        // In Expo Go / dev: Updates.reloadAsync may not work. Tell the user.
        Alert.alert(t('common.switch_language'), 'Restart the app to apply RTL change.');
      }
    }
  };

  return (
    <Pressable onPress={onPress} style={styles.btn} hitSlop={8}>
      <Text style={styles.label}>{next === 'ar' ? 'العربية' : 'Nederlands'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  label: { fontSize: 14, fontWeight: '600' },
});
