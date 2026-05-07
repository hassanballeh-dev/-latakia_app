import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Throw a readable message instead of letting createClient throw deep inside
  // supabase-js. The root layout's ErrorBoundary then shows it on screen so a
  // misconfigured EAS build doesn't go black.
  throw new Error(
    'Supabase env vars missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env (local) and via `eas env:push preview --path ./.env` (cloud builds).',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    // We don't use Supabase Auth at all in this app.
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// ----- Domain types (mirror supabase/migrations/0001_init.sql) -----

export type Category = {
  id: string;
  name_ar: string;
  name_nl: string;
  sort_order: number;
};

export type MenuItem = {
  id: string;
  category_id: string;
  name_ar: string;
  name_nl: string;
  price: number;
  is_available: boolean;
  sort_order: number;
};

export type OrderType = 'dine_in' | 'takeaway';
export type InvoiceLang = 'ar' | 'nl';

export type Order = {
  id: string;
  order_date: string; // 'YYYY-MM-DD'
  daily_number: number;
  status: 'confirmed' | 'cancelled';
  order_type: OrderType;
  invoice_lang: InvoiceLang;
  subtotal: number;
  tax_rate: number;   // e.g. 0.12 or 0.06
  tax_amount: number;
  total: number;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name_ar_snapshot: string;
  name_nl_snapshot: string;
  unit_price: number;
  quantity: number;
};
