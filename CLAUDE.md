# LATAKIA — Restaurant Waiter App

Single-tablet Android app for waiters: build basket → review → confirm → print thermal invoice → order saved to Supabase. No kitchen screen, no waiter accounts. Admin dashboard behind a 4-digit PIN.

---

## ⏯ Resume here (last session: May 2026)

**Status:** All five phases complete. App is feature-complete pending real thermal-printer integration.

**Done:**
- ✅ **Phase 1** — Expo Router scaffold, Supabase migration (`supabase/migrations/0001_init.sql` + `0002_seed.sql` already applied to the live project), `.env` configured with real credentials, i18n + RTL, `lib/` modules, tab skeleton (Menu / Orders / Admin), Supabase end-to-end verified (categories fetch + `create_order` RPC both 200).
- ✅ **Phase 2** — Menu screen (categories, item grid, refresh), basket FAB, basket modal with qty controls + confirm-and-print flow that actually inserts an order via `create_order` RPC and calls the printer placeholder.
- ✅ **Tax + order type** — `dine_in` (12%) / `takeaway` (6%) selectable at confirm time, server-authoritative tax computation in `create_order(items, order_type)`. Migration `0003_order_type_and_tax.sql` applied.
- ✅ **UI polish** — warm terracotta/cream palette in `lib/theme.ts`, card shadows, larger price typography, sticky category bar, web max-width container so the desktop view doesn't sprawl.
- ✅ **Phase 3** — Order history list (`app/(tabs)/orders.tsx`) with date filter (Alle / Vandaag / arbitrary date — uses `@react-native-community/datetimepicker` on native and HTML `<input type="date">` on web via `date-picker.tsx` / `date-picker.web.tsx`). Order detail screen (`app/orders/[id].tsx`) shows header (number + type badge + datetime), line items from `order_items` snapshots, full tax breakdown, and a Reprint button that re-calls `printInvoice()` using the historical snapshot data. `useFocusEffect` refetches on screen focus so newly confirmed orders appear without manual refresh.
- ✅ **Phase 4** — Admin tab is gated by a 4-digit PIN (`useAdminAuth` Zustand store, in-memory only — closing/refreshing re-prompts; PIN comes from `EXPO_PUBLIC_ADMIN_PIN`). Dashboard has three sections: **Categorieën** (CRUD with bottom-sheet form modal — AR + NL names), **Items** (sectioned by category with inline availability toggle, edit + delete, full form modal with price + category + availability), **Bestellingen** (date filter defaulting to today + revenue card showing total + order count + the same `OrderRow` list as the customer-facing tab). Deleting a category cascades to its items but order history survives via the snapshot system.
- ✅ **Change PIN from dashboard** — PIN now lives in AsyncStorage (`latakia.adminPin`) with `EXPO_PUBLIC_ADMIN_PIN` as the factory default. `useAdminAuth.init()` runs at app startup (called from root layout) to load it. **PIN wijzigen** button in admin tab bar opens a sheet asking for new PIN + confirm.
- ✅ **Phase 5** — Invoice layout. `lib/invoice-format.ts` builds the 32-char-wide plain-text version that a thermal printer would emit. `printInvoice()` console.logs that text (instead of raw JSON) — what you see in the dev terminal is exactly what the receipt would look like. `components/invoice-preview.tsx` is a visual receipt component (~360px wide, monospace). `InvoicePreviewModal` shows it after every confirm and after every reprint. The order detail screen also has a **Bon bekijken** button that opens the preview without printing again.
- ✅ **Per-order invoice language** (migration `0004_invoice_language.sql`) — `orders.invoice_lang` is `'ar'` or `'nl'`. Waiter picks at confirm time in the basket (defaults to `APP_CONFIG.defaultInvoiceLanguage`, currently NL). The invoice prints in just that one language; the order detail screen has a per-reprint language selector that defaults to `order.invoice_lang` but can be flipped before reprinting (e.g. customer originally got AR but later asks for NL). Migration includes updated `create_order(items, order_type, invoice_lang)` RPC.
- ✅ **Browser print button** — on web only, the invoice preview modal has a "Bon afdrukken via browser" button (orange amber). Opens a new window containing the formatted receipt as monospace `<pre>` and triggers `window.print()`. Lets you validate the layout on any USB/network printer ahead of the real thermal printer.
- ✅ **Admin success messages** — every category/item add / update / delete now shows a confirmation Alert (`Categorie toegevoegd`, `Item bijgewerkt`, `Item verwijderd`, etc).
- ✅ **Change PIN UX** — modal now requires the **old PIN** plus the new PIN. Wrong old PIN → red error alert + clears the field. Success → green-ish "Pincode succesvol gewijzigd" alert.
- ✅ **UX fixes** — Date picker in Bestellingen now always displays the selected date (was being blanked when it matched a quick-chip value). PIN-gate dots are tappable to refocus the input (mobile soft keyboard dismisses when you tap away). Language toggle in the header has a 🌐 icon and stronger contrast so it's easier to find.

**Pending (deferred — not blockers for daily use):**
- ⏳ **Real thermal-printer integration** — `lib/printer.ts` is the only file that needs to change once the brand/model is confirmed (Bluetooth or WiFi). The current `printInvoice()` logs the formatted text via `formatInvoiceText` from `lib/invoice-format.ts` — when the real driver is wired in, send the same string + ESC/POS control bytes (cut, alignment, etc).
- ⏳ **Restaurant address + phone** — empty strings in `lib/config.ts`. Add before going live if you want them on the receipt.
- ⏳ **Replace factory-default PIN** — currently `1234` in `.env`. Either change the env var before building the production APK, or have the owner set a new PIN from the dashboard on first launch (now persisted in AsyncStorage).

**To resume / verify:**
1. `cd /home/LATAKIA && npx expo start` (or `--web` / `--tunnel`).
2. Smoke test: order a few items → confirm → preview modal shows the bilingual receipt → close → check the terminal for the formatted-text log → check Supabase Table Editor.
3. Admin tab → enter PIN (default `1234`) → try CRUD on categories/items, change PIN, look at revenue.
4. Bestellingen → tap an order → reprint shows the same preview.

**Open questions / decisions deferred:**
- Thermal printer brand/model — still TBD. `lib/printer.ts` is the only file that needs to change when we know.
- Restaurant address + phone in `lib/config.ts` are empty strings — fill in before going live.
- Admin PIN currently `1234` in `.env`. Change before deploying to the tablet.

**Anything not in this list is fair game to ask about — but don't add features the spec doesn't request** (no kitchen screen, no waiter login, no payments, no analytics).

---

## Stack

- **Expo SDK 54** + **Expo Router 6** (file-based routing in `app/`)
- **React Native 0.81**, React 19, TypeScript
- **Supabase** for data (no Supabase Auth — we don't use auth at all)
- **i18next** + **react-i18next** for Arabic + Dutch (full UI + invoices)
- **AsyncStorage** for the language preference
- **EAS Build** → APK → side-load on one tablet (no Play Store)

## Project layout

```
app/                      # Expo Router routes
  _layout.tsx             # Root layout (i18n + RTL bootstrap, providers)
  (tabs)/                 # Bottom tab navigator
    _layout.tsx           # Tab bar config
    index.tsx             # Menu screen (default)
    orders.tsx            # Order history list
    admin.tsx             # Admin (renders PIN gate, then dashboard)
  basket.tsx              # Basket modal/route
  orders/[id].tsx         # Order detail (reprint here)
lib/
  supabase.ts             # Supabase client (uses EXPO_PUBLIC_SUPABASE_*)
  config.ts               # Restaurant name, invoice header — edit per deployment
  i18n.ts                 # i18next setup (AR + NL), RTL helper
  printer.ts              # Print stub — console.log invoice JSON; swap for real lib later
  basket.ts               # Zustand store (or context) for current basket
  db.ts                   # Typed Supabase queries (categories, items, orders)
locales/
  ar.json                 # Arabic strings
  nl.json                 # Dutch strings
supabase/
  migrations/             # SQL migrations — run in Supabase SQL editor
components/               # Shared UI components (kept from scaffold + ours)
```

## Database schema (Supabase)

Migrations in `supabase/migrations/` (run in the Supabase SQL editor in order). Tables:

- `categories(id, name_ar, name_nl, sort_order)`
- `menu_items(id, category_id, name_ar, name_nl, price, is_available, sort_order)`
- `orders(id, daily_number, order_date, status, order_type, invoice_lang, subtotal, tax_rate, tax_amount, total, created_at)`
- `order_items(id, order_id, menu_item_id, name_ar_snapshot, name_nl_snapshot, quantity, unit_price)`

**Order numbering**: `daily_number` resets each calendar day. The Postgres function `next_daily_order_number(today date)` computes `MAX(daily_number)+1 WHERE order_date = today` atomically — safe even under concurrent inserts. Display is `#001`, `#002`, etc., zero-padded in the UI only.

**Tax (migration 0003)**: `order_type` is either `'dine_in'` or `'takeaway'`. The waiter picks at confirm time. `create_order(items, order_type)` is **server-authoritative** — the rate is looked up inside the function (12% for dine-in, 6% for takeaway), not passed by the client. `tax_rate` is stored per row so changing rates later won't rewrite history. Menu prices are pre-tax; `total = subtotal + tax_amount`. The basket UI shows a live preview using `TAX_RATES` in `lib/db.ts` (kept in sync with the SQL function — change both if rates change).

**Snapshots**: `order_items.name_*_snapshot` and `unit_price` are copied at order time so editing/deleting a menu item never alters historical orders.

## i18n + RTL

- `lib/i18n.ts` initializes i18next with `ar` and `nl` namespaces from `locales/`.
- Language is persisted in AsyncStorage. **Default app language is Arabic (`ar`)** — set in `lib/config.ts` (`APP_CONFIG.defaultLanguage`).
- **Default invoice language is Dutch (`nl`)** — set in `lib/config.ts` (`APP_CONFIG.defaultInvoiceLanguage`). Independent from the app UI language because most customers in NL want a Dutch receipt regardless of waiter UI.
- `app/_layout.tsx` calls `I18nManager.forceRTL(lang === 'ar')` and reloads via `Updates.reloadAsync()` if the direction changed (RN requires a reload to flip RTL).
- **Every visible string MUST go through `t('key')`** — no hardcoded UI text. The invoice template renders both languages on the same receipt (no t() needed there; pulls both `name_ar` and `name_nl` directly).

## Env vars

Copy `.env.example` → `.env`. All `EXPO_PUBLIC_*` vars are inlined into the JS bundle at build time:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_ADMIN_PIN` (4 digits, e.g. `1234`)

The PIN being in the bundle is acceptable for this deployment (single-tablet, physical access required, no public distribution).

## Common commands

```bash
npm install                     # install deps
npx expo start                  # dev server (scan QR with Expo Go on tablet)
npx expo start --android        # run on connected Android device/emulator
npx expo lint                   # eslint
npx tsc --noEmit                # typecheck (we don't ship a `typecheck` script)
eas build -p android --profile preview   # build APK for tablet install
```

For Supabase schema changes: edit a new file in `supabase/migrations/` and paste it into the Supabase SQL editor (we don't use the Supabase CLI in this repo — single dev, single environment).

## Conventions

- **Currency**: prices stored as `numeric(10,2)` in DB; format with `Intl.NumberFormat` based on the active locale. Default currency symbol is set in `lib/config.ts`.
- **Dates**: store as `timestamptz` (UTC). Display in the tablet's local zone.
- **No `console.log` in committed code** except `lib/printer.ts` (intentional placeholder).
- **Don't add features the spec doesn't request** — no kitchen screen, no waiter login, no analytics, no online ordering.
- **Editing existing menu items must not break history** — that's why `order_items` snapshots name + price.

## Printer

`lib/printer.ts` exports `printInvoice(invoice)` which currently `console.log`s a structured JSON of the receipt. When the printer brand is confirmed, swap the implementation; the call sites should not change.

## What this app intentionally does NOT have

- No user accounts, no waiter IDs, no Supabase Auth
- No kitchen display screen (printer replaces it)
- No payment integration
- No multi-restaurant / multi-tenant support
- No offline mode (tablet is assumed online)
