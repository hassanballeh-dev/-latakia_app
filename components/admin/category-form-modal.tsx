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

import { createCategory, updateCategory } from '@/lib/db';
import { showInfo } from '@/lib/feedback';
import type { Category } from '@/lib/supabase';
import { theme } from '@/lib/theme';

type Props = {
  visible: boolean;
  initial: Category | null; // null = create, set = edit
  onClose: () => void;
  onSaved: (action: 'created' | 'updated') => void;
};

export function CategoryFormModal({ visible, initial, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const [nameAr, setNameAr] = useState('');
  const [nameNl, setNameNl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setNameAr(initial?.name_ar ?? '');
      setNameNl(initial?.name_nl ?? '');
      setSubmitting(false);
    }
  }, [visible, initial]);

  const onSave = async () => {
    if (!nameAr.trim() || !nameNl.trim()) {
      showInfo(t('admin.validation_required'));
      return;
    }
    setSubmitting(true);
    try {
      const action: 'created' | 'updated' = initial ? 'updated' : 'created';
      if (initial) {
        await updateCategory(initial.id, { name_ar: nameAr.trim(), name_nl: nameNl.trim() });
      } else {
        await createCategory({ name_ar: nameAr.trim(), name_nl: nameNl.trim() });
      }
      onClose();
      onSaved(action);
    } catch (e: any) {
      showInfo(e?.message ?? String(e), t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>
            {initial ? t('admin.edit_category') : t('admin.add_category')}
          </Text>

          <Field label={t('admin.name_nl')} value={nameNl} onChangeText={setNameNl} />
          <Field label={t('admin.name_ar')} value={nameAr} onChangeText={setNameAr} textAlign="right" />

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

function Field({
  label,
  value,
  onChangeText,
  textAlign,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  textAlign?: 'left' | 'right';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, textAlign === 'right' && { textAlign: 'right' }]}
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
    gap: 16,
    paddingBottom: 32,
  },
  title: { fontSize: 20, fontWeight: '800', color: theme.colors.text, marginBottom: 4 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: theme.colors.muted },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
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
