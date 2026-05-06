import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { CategoryFormModal } from '@/components/admin/category-form-modal';
import { ChangePinModal } from '@/components/admin/change-pin-modal';
import { ItemFormModal } from '@/components/admin/item-form-modal';
import { PinGate } from '@/components/admin/pin-gate';
import { DateFilter } from '@/components/date-filter';
import { OrderRow } from '@/components/order-row';
import { useMenu } from '@/hooks/use-menu';
import { useOrders } from '@/hooks/use-orders';
import { useAdminAuth } from '@/lib/admin-auth';
import { deleteCategory, deleteMenuItem, updateMenuItem } from '@/lib/db';
import { confirmAction, showInfo } from '@/lib/feedback';
import { formatPrice, localizedName, type Lang } from '@/lib/i18n';
import type { Category, MenuItem } from '@/lib/supabase';
import { theme } from '@/lib/theme';

type Section = 'categories' | 'items' | 'orders';

export default function AdminScreen() {
  const authenticated = useAdminAuth((s) => s.authenticated);
  const logout = useAdminAuth((s) => s.logout);
  const { t } = useTranslation();
  const [section, setSection] = useState<Section>('categories');
  const [pinModalOpen, setPinModalOpen] = useState(false);

  if (!authenticated) {
    return <PinGate />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.maxWidth}>
        {/* Horizontally scrollable so all 5 buttons fit on small phones (e.g. iPhone 11 Pro 375pt). */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
          style={styles.tabBarScroll}>
          <SectionTab label={t('admin.categories')} active={section === 'categories'} onPress={() => setSection('categories')} />
          <SectionTab label={t('admin.items')} active={section === 'items'} onPress={() => setSection('items')} />
          <SectionTab label={t('admin.orders_section')} active={section === 'orders'} onPress={() => setSection('orders')} />
          <Pressable onPress={() => setPinModalOpen(true)} style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>{t('admin.change_pin')}</Text>
          </Pressable>
          <Pressable onPress={logout} style={styles.logout}>
            <Text style={styles.logoutText}>{t('admin.logout')}</Text>
          </Pressable>
        </ScrollView>

        {section === 'categories' && <CategoriesSection />}
        {section === 'items' && <ItemsSection />}
        {section === 'orders' && <OrdersSection />}

        <ChangePinModal visible={pinModalOpen} onClose={() => setPinModalOpen(false)} />
      </View>
    </View>
  );
}

function SectionTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

// ============================================================
// Categories
// ============================================================
function CategoriesSection() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language as Lang) ?? 'nl';
  const { categories, loading, reload } = useMenu();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const onAdd = () => { setEditing(null); setModalOpen(true); };
  const onEdit = (c: Category) => { setEditing(c); setModalOpen(true); };

  const onSaved = async (action: 'created' | 'updated') => {
    await reload();
    showInfo(action === 'created' ? t('admin.category_added') : t('admin.category_updated'));
  };

  const onDelete = async (c: Category) => {
    const ok = await confirmAction({
      title: localizedName(c, lang),
      message: t('admin.delete_confirm_category'),
      confirmLabel: t('admin.delete'),
      cancelLabel: t('admin.cancel'),
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteCategory(c.id);
      await reload();
      showInfo(t('admin.category_deleted'));
    } catch (e: any) {
      showInfo(e?.message ?? String(e), t('common.error'));
    }
  };

  return (
    <View style={styles.sectionContainer}>
      <Pressable onPress={onAdd} style={styles.addBtn}>
        <Text style={styles.addBtnText}>+ {t('admin.add_category')}</Text>
      </Pressable>

      <FlatList
        data={categories}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={theme.colors.primary} />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{item.name_nl}</Text>
              <Text style={styles.rowSub}>{item.name_ar}</Text>
            </View>
            <RowActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} />
          </View>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>{t('admin.no_categories')}</Text> : null}
      />

      <CategoryFormModal
        visible={modalOpen}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSaved={onSaved}
      />
    </View>
  );
}

// ============================================================
// Items
// ============================================================
function ItemsSection() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language as Lang) ?? 'nl';
  const { categories, items, loading, reload } = useMenu();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [defaultCategoryId, setDefaultCategoryId] = useState<string | null>(null);

  const onAdd = (categoryId?: string) => {
    setEditing(null);
    setDefaultCategoryId(categoryId ?? null);
    setModalOpen(true);
  };
  const onEdit = (item: MenuItem) => {
    setEditing(item);
    setDefaultCategoryId(null);
    setModalOpen(true);
  };

  const onSaved = async (action: 'created' | 'updated') => {
    await reload();
    showInfo(action === 'created' ? t('admin.item_added') : t('admin.item_updated'));
  };

  const onDelete = async (item: MenuItem) => {
    const ok = await confirmAction({
      title: localizedName(item, lang),
      message: t('admin.delete_confirm_item'),
      confirmLabel: t('admin.delete'),
      cancelLabel: t('admin.cancel'),
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteMenuItem(item.id);
      await reload();
      showInfo(t('admin.item_deleted'));
    } catch (e: any) {
      showInfo(e?.message ?? String(e), t('common.error'));
    }
  };

  const toggleAvailable = async (item: MenuItem, value: boolean) => {
    try {
      await updateMenuItem(item.id, {
        category_id: item.category_id,
        name_ar: item.name_ar,
        name_nl: item.name_nl,
        price: item.price,
        is_available: value,
      });
      await reload();
    } catch (e: any) {
      showInfo(e?.message ?? String(e), t('common.error'));
    }
  };

  // Build sectioned data: [{ category, items }]
  const sections = useMemo(
    () => categories.map((c) => ({ category: c, items: items.filter((i) => i.category_id === c.id) })),
    [categories, items],
  );

  return (
    <View style={styles.sectionContainer}>
      <Pressable onPress={() => onAdd()} style={styles.addBtn}>
        <Text style={styles.addBtnText}>+ {t('admin.add_item')}</Text>
      </Pressable>

      <FlatList
        data={sections}
        keyExtractor={(s) => s.category.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={theme.colors.primary} />}
        renderItem={({ item: section }) => (
          <View style={{ marginBottom: 18 }}>
            <Text style={styles.groupHeader}>{localizedName(section.category, lang)}</Text>
            {section.items.length === 0 && <Text style={styles.emptyGroup}>{t('admin.no_items')}</Text>}
            {section.items.map((it) => (
              <View key={it.id} style={styles.row}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.rowTitle}>{it.name_nl}</Text>
                  <Text style={styles.rowSub}>{it.name_ar} · {formatPrice(Number(it.price), lang)}</Text>
                </View>
                <View style={styles.itemActions}>
                  <Switch
                    value={it.is_available}
                    onValueChange={(v) => toggleAvailable(it, v)}
                    trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
                    thumbColor="#fff"
                  />
                  <RowActions onEdit={() => onEdit(it)} onDelete={() => onDelete(it)} />
                </View>
              </View>
            ))}
          </View>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>{t('admin.no_categories')}</Text> : null}
      />

      <ItemFormModal
        visible={modalOpen}
        initial={editing}
        categories={categories}
        defaultCategoryId={defaultCategoryId}
        lang={lang}
        onClose={() => setModalOpen(false)}
        onSaved={onSaved}
      />
    </View>
  );
}

// ============================================================
// Orders + Revenue
// ============================================================
function OrdersSection() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language as Lang) ?? 'nl';
  const today = todayIso();
  const [dateFilter, setDateFilter] = useState<string | null>(today);
  const { orders, loading, reload } = useOrders(dateFilter);

  const revenue = useMemo(
    () => orders.reduce((sum, o) => sum + Number(o.total), 0),
    [orders],
  );

  return (
    <View style={styles.sectionContainer}>
      <DateFilter value={dateFilter} onChange={setDateFilter} />

      <View style={styles.revenueCard}>
        <Text style={styles.revenueLabel}>{t('admin.revenue_total')}</Text>
        <Text style={styles.revenueValue}>{formatPrice(revenue, lang)}</Text>
        <Text style={styles.revenueCount}>
          {t('admin.orders_count', { count: orders.length })}
        </Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <OrderRow order={item} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={theme.colors.primary} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>{t('orders.empty')}</Text> : null}
      />
    </View>
  );
}

// ============================================================
// Shared bits
// ============================================================
function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.actionRow}>
      <Pressable onPress={onEdit} style={styles.editBtn}>
        <Text style={styles.editText}>{t('admin.edit')}</Text>
      </Pressable>
      <Pressable onPress={onDelete} style={styles.deleteBtn}>
        <Text style={styles.deleteText}>{t('admin.delete')}</Text>
      </Pressable>
    </View>
  );
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center' },
  maxWidth: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? theme.webMaxWidth : undefined,
  },
  tabBarScroll: {
    flexGrow: 0,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',
  },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.radius.pill, backgroundColor: theme.colors.primarySoft },
  tabActive: { backgroundColor: theme.colors.primary },
  tabLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.primaryDark },
  tabLabelActive: { color: '#fff' },
  iconBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.radius.pill, backgroundColor: theme.colors.primarySoft, borderWidth: 1, borderColor: theme.colors.border },
  iconBtnText: { color: theme.colors.primaryDark, fontWeight: '700', fontSize: 13 },
  logout: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.radius.pill, backgroundColor: '#fbe5e0' },
  logoutText: { color: theme.colors.danger, fontWeight: '700', fontSize: 13 },

  sectionContainer: { flex: 1 },
  addBtn: {
    margin: 14,
    paddingVertical: 14,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  list: { paddingHorizontal: 14, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
  },
  rowTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  rowSub: { fontSize: 13, color: theme.colors.muted },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionRow: { flexDirection: 'row', gap: 8 },
  editBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.radius.sm, backgroundColor: theme.colors.primarySoft },
  editText: { color: theme.colors.primaryDark, fontWeight: '700', fontSize: 13 },
  deleteBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.radius.sm, backgroundColor: '#fbe5e0' },
  deleteText: { color: theme.colors.danger, fontWeight: '700', fontSize: 13 },

  groupHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
    marginStart: 4,
  },
  emptyGroup: { color: theme.colors.muted, fontStyle: 'italic', marginBottom: 8, marginStart: 4 },
  empty: { textAlign: 'center', padding: 32, color: theme.colors.muted, fontSize: 16 },

  revenueCard: {
    margin: 14,
    padding: 18,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    ...theme.shadow.card,
    gap: 4,
  },
  revenueLabel: { color: '#fff', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.85 },
  revenueValue: { color: '#fff', fontSize: 32, fontWeight: '900' },
  revenueCount: { color: '#fff', fontSize: 13, opacity: 0.85, fontWeight: '600' },
});
