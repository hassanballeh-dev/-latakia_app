import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { createMenuItem, updateMenuItem } from '@/lib/db';
import { showInfo } from '@/lib/feedback';
import { localizedName, type Lang } from '@/lib/i18n';
import type { Category, MenuItem } from '@/lib/supabase';
import { theme } from '@/lib/theme';

type Props = {
  visible: boolean;
  initial: MenuItem | null;
  categories: Category[];
  defaultCategoryId: string | null;
  lang: Lang;
  onClose: () => void;
  onSaved: (action: 'created' | 'updated') => void;
};

export function ItemFormModal({ visible, initial, categories, defaultCategoryId, lang, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const [nameAr, setNameAr] = useState('');
  const [nameNl, setNameNl] = useState('');
  const [priceText, setPriceText] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [available, setAvailable] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setNameAr(initial?.name_ar ?? '');
    setNameNl(initial?.name_nl ?? '');
    setPriceText(initial?.price != null ? String(initial.price) : '');
    setCategoryId(initial?.category_id ?? defaultCategoryId ?? categories[0]?.id ?? null);
    setAvailable(initial?.is_available ?? true);
    setSubmitting(false);
  }, [visible, initial, defaultCategoryId, categories]);

  const onSave = async () => {
    const price = Number(priceText.replace(',', '.'));
    if (!nameAr.trim() || !nameNl.trim() || !categoryId || !Number.isFinite(price) || price < 0) {
      showInfo(t('admin.validation_required'));
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        category_id: categoryId,
        name_ar: nameAr.trim(),
        name_nl: nameNl.trim(),
        price,
        is_available: available,
      };
      const action: 'created' | 'updated' = initial ? 'updated' : 'created';
      if (initial) {
        await updateMenuItem(initial.id, payload);
      } else {
        await createMenuItem(payload);
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
            {initial ? t('admin.edit_item') : t('admin.add_item')}
          </Text>

          <ScrollView contentContainerStyle={styles.formGap}>
            <Field label={t('admin.name_nl')} value={nameNl} onChangeText={setNameNl} />
            <Field label={t('admin.name_ar')} value={nameAr} onChangeText={setNameAr} textAlign="right" />
            <Field
              label={t('admin.price')}
              value={priceText}
              onChangeText={setPriceText}
              keyboardType="decimal-pad"
            />

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('admin.category')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {categories.map((c) => {
                  const active = c.id === categoryId;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setCategoryId(c.id)}
                      style={[styles.catPill, active && styles.catPillActive]}>
                      <Text style={[styles.catPillLabel, active && styles.catPillLabelActive]}>
                        {localizedName(c, lang)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>{t('admin.available')}</Text>
              <Switch
                value={available}
                onValueChange={setAvailable}
                trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
                thumbColor="#fff"
              />
            </View>
          </ScrollView>

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
  keyboardType,
  textAlign,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  keyboardType?: 'default' | 'decimal-pad';
  textAlign?: 'left' | 'right';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
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
    paddingBottom: 32,
    maxHeight: '90%',
  },
  formGap: { gap: 16, paddingBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: theme.colors.text, marginBottom: 12 },
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
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primarySoft,
  },
  catPillActive: { backgroundColor: theme.colors.primary },
  catPillLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.primaryDark },
  catPillLabelActive: { color: '#fff' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: theme.radius.md, alignItems: 'center' },
  btnCancel: { backgroundColor: theme.colors.primarySoft },
  btnCancelText: { color: theme.colors.primaryDark, fontWeight: '700', fontSize: 16 },
  btnSave: { backgroundColor: theme.colors.primary },
  btnSaveText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
