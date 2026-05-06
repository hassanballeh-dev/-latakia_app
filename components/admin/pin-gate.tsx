import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAdminAuth } from '@/lib/admin-auth';
import { theme } from '@/lib/theme';

export function PinGate() {
  const { t } = useTranslation();
  const tryPin = useAdminAuth((s) => s.tryPin);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Auto-focus so the soft keyboard / browser caret lands here on open.
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    setPin(digits);
    setError(false);
    if (digits.length === 4) {
      const ok = tryPin(digits);
      if (!ok) {
        setError(true);
        setPin('');
        Animated.sequence([
          Animated.timing(shake, { toValue: 12, duration: 60, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(shake, { toValue: -12, duration: 60, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(shake, { toValue: 8, duration: 60, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(shake, { toValue: -8, duration: 60, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(shake, { toValue: 0, duration: 60, easing: Easing.linear, useNativeDriver: true }),
        ]).start();
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('admin.title')}</Text>
        <Text style={styles.prompt}>{t('admin.pin_prompt')}</Text>

        {/* Tap anywhere on the dots to refocus the hidden input — important on
            mobile where the soft keyboard dismisses if the user taps away. */}
        <Pressable onPress={() => inputRef.current?.focus()}>
          <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shake }] }]}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i < pin.length && styles.dotFilled,
                  error && styles.dotError,
                ]}
              />
            ))}
          </Animated.View>
        </Pressable>

        {error && <Text style={styles.errorText}>{t('admin.pin_wrong')}</Text>}

        {/* Hidden input that captures keystrokes; tap the dots to refocus. */}
        <TextInput
          ref={inputRef}
          value={pin}
          onChangeText={handleChange}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={4}
          secureTextEntry
          style={styles.hiddenInput}
          caretHidden
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 32,
    alignItems: 'center',
    gap: 18,
    minWidth: 280,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  title: { fontSize: 24, fontWeight: '800', color: theme.colors.primary },
  prompt: { fontSize: 16, color: theme.colors.muted },
  dotsRow: { flexDirection: 'row', gap: 16, marginVertical: 12 },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: theme.colors.primary },
  dotError: { borderColor: theme.colors.danger, backgroundColor: 'transparent' },
  errorText: { color: theme.colors.danger, fontWeight: '700' },
  // Off-screen but focusable. opacity:0 keeps the input invisible but still functional.
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
});
