import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAdminAuth } from '@/lib/admin-auth';
import { showInfo } from '@/lib/feedback';
import { theme } from '@/lib/theme';

type Props = { visible: boolean; onClose: () => void };

export function ChangePinModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const changePin = useAdminAuth((s) => s.changePin);
  const currentPin = useAdminAuth((s) => s.currentPin);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setOldPin('');
      setNewPin('');
      setSubmitting(false);
    }
  }, [visible]);

  const onSave = async () => {
    if (oldPin !== currentPin) {
      showInfo(t('admin.old_pin_wrong'), t('common.error'));
      setOldPin('');
      return;
    }
    if (!/^\d{4}$/.test(newPin)) {
      showInfo(t('admin.pin_must_be_4_digits'), t('common.error'));
      return;
    }
    setSubmitting(true);
    try {
      await changePin(newPin);
      onClose();
      showInfo(t('admin.pin_changed'));
    } catch (e: any) {
      showInfo(e?.message ?? String(e), t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const sanitize = (s: string) => s.replace(/\D/g, '').slice(0, 4);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t('admin.change_pin')}</Text>

          <Field
            label={t('admin.old_pin')}
            value={oldPin}
            onChangeText={(s) => setOldPin(sanitize(s))}
          />
          <Field
            label={t('admin.new_pin')}
            value={newPin}
            onChangeText={(s) => setNewPin(sanitize(s))}
          />

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={[styles.btn, styles.btnCancel]} disabled={submitting}>
              <Text style={styles.btnCancelText}>{t('admin.cancel')}</Text>
            </Pressable>
            <Pressable onPress={onSave} style={[styles.btn, styles.btnSave]} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnSaveText}>{t('admin.save')}</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (s: string) => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={4}
        secureTextEntry
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    padding: 24,
    paddingBottom: 32,
    gap: 16,
  },
  title: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: theme.colors.muted },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 22,
    letterSpacing: 8,
    textAlign: 'center',
    color: theme.colors.text,
    backgroundColor: theme.colors.bg,
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: theme.radius.md, alignItems: 'center' },
  btnCancel: { backgroundColor: theme.colors.primarySoft },
  btnCancelText: { color: theme.colors.primaryDark, fontWeight: '700', fontSize: 16 },
  btnSave: { backgroundColor: theme.colors.primary },
  btnSaveText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
