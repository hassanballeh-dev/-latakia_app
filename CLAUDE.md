# LATAKIA — Restaurant Waiter App

Single-tablet Android app for waiters: build basket → review → confirm (with order type + invoice language) → print thermal invoice → order saved to Supabase. No kitchen screen, no waiter accounts. Admin dashboard behind a 4-digit PIN.

---

## ⏯ Resume here

**Status:** Feature-complete on web. Pending only the real thermal-printer driver (model TBD) and an Android APK build.

### What works end-to-end
- **Menu** — categories pills, item grid, pull-to-refresh, availability greys out non-available items, terracotta/cream theme, web max-width container so the desktop view doesn't sprawl.
- **Basket** — qty controls, two pill rows: **Order type** (Dine-in 12% / Takeaway 6%) and **Invoice language** (NL / AR). Live tax breakdown above the confirm button. Confirm → save order → print → preview modal.
- **Order history** — newest first, filter chips (Alle / Vandaag / arbitrary date — date picker is platform-split: native `@react-native-community/datetimepicker`, web HTML `<input type="date">`). `useFocusEffect` refetches on screen focus so new orders show up without manual refresh.
- **Order detail** — header with `#001` + type badge + datetime, line items from `order_items` snapshots, full tax breakdown. Footer has a per-reprint **language selector** (defaults to `order.invoice_lang`, can be flipped — e.g. customer originally got AR but later asks for NL), **Bon bekijken** preview button, **Opnieuw afdrukken** button.
- **Invoice preview** — `components/invoice-preview.tsx` renders a single-language receipt (~360px wide, monospace). Modal opens after every confirm and after every reprint. On web only, the modal includes a **"Bon afdrukken via browser"** button (orange amber) that opens a new window with the formatted receipt as `<pre>` and triggers `window.print()` — lets you validate the layout on any USB/network printer ahead of the real thermal printer.
- **Admin** — PIN gate with shake-on-error, three sections: **Categorieën** (CRUD + bottom-sheet form), **Items** (sectioned by category, inline availability `<Switch>`, full form modal with price + category picker), **Bestellingen** (date filter defaulting to today + revenue card with total + order count + the same `OrderRow` list as the customer-facing tab). Deleting a category cascades to its items but order history survives via the snapshot system.
- **Change PIN from dashboard** — old PIN + new PIN in a bottom sheet. Wrong old PIN → red error + clears the field. Success → "Pincode succesvol gewijzigd" alert.
- **Success / confirm dialogs** — every CRUD op shows a confirmation alert (`Categorie toegevoegd`, `Item bijgewerkt`, `Item verwijderd`, etc). Delete prompts use a real confirm dialog. See "Cross-platform feedback" below.

### Pending (not blockers for daily use)
- **Real thermal-printer driver** — `lib/printer.ts` is the only file that needs to change once the brand/model is confirmed. Currently `printInvoice()` logs the formatted text via `formatInvoiceText` from `lib/invoice-format.ts`. When the real driver is wired in, send the same string + ESC/POS control bytes (cut, alignment, etc).
- **Restaurant address + phone** — empty strings in `lib/config.ts`. Add before going live if you want them on the receipt.
- **Replace factory-default PIN** — currently `1234` in `.env`. Either change the env var before the production build, or have the owner set a new PIN from the dashboard on first launch (now persisted in AsyncStorage).
- **EAS APK build** — never run yet. `eas build -p android --profile preview` will build the side-loadable APK once the printer is wired in.

### Open question waiting on the client
- Thermal printer **brand + model + connection** (Bluetooth / WiFi / USB / Ethernet). Recommended: a Bluetooth ESC/POS 80mm printer (Star TSP143IIIBI or Epson TM-m30III). Once known, install `react-native-thermal-receipt-printer-image-qr` (or equivalent), replace `lib/printer.ts`, add a one-time pairing screen in admin.

### To resume / verify
1. `cd /home/LATAKIA && npx expo start --web` (or `--tunnel` for a real tablet via Expo Go).
2. Migration sanity: schema and seed live in Supabase already — `supabase/migrations/0001_init.sql`, `0002_seed.sql`, `0003_order_type_and_tax.sql`, `0004_invoice_language.sql` have all been applied to the live project.
3. Smoke test: place an order → preview shows the receipt in the chosen language → check the terminal for the `BEGIN RECEIPT` block → check Supabase Table Editor for the new row.
4. Admin tab → enter PIN (default `1234`) → CRUD on categories/items, change PIN, look at revenue.
5. Bestellingen → tap an order → flip the language pill → reprint shows the preview in the other language.

**Anything not in this list is fair game to ask about — but don't add features the spec doesn't request** (no kitchen screen, no waiter login, no payments, no analytics).

---

## Stack

- **Expo SDK 54** + **Expo Router 6** (file-based routing in `app/`)
- **React Native 0.81**, React 19, TypeScript
- **Supabase** for data — no Supabase Auth (we don't use auth at all; admin protected by a single 4-digit PIN)
- **i18next** + **react-i18next** for Arabic + Dutch (full UI + invoices)
- **Zustand** for in-memory client state (basket, admin auth)
- **AsyncStorage** for persisted preferences (language, admin PIN)
- **EAS Build** → APK → side-load on one tablet (no Play Store)

## Project layout

```
app/                            # Expo Router routes
  _layout.tsx                   # Root layout: i18n bootstrap + admin-auth init + Stack
  (tabs)/
    _layout.tsx                 # Bottom tab bar (Menu / Bestellingen / Beheer) + LanguageToggle in header
    index.tsx                   # Menu screen
    orders.tsx                  # Order history list
    admin.tsx                   # PIN gate + 3-section admin dashboard
  basket.tsx                    # Basket modal route
  orders/[id].tsx               # Order detail (preview + reprint with language picker)
components/
  basket-fab.tsx
  category-pills.tsx            # Sticky category bar on menu
  date-filter.tsx               # Alle / Vandaag / arbitrary date
  date-picker.tsx               # Native: @react-native-community/datetimepicker
  date-picker.web.tsx           # Web: HTML <input type="date">  (Metro auto-picks per platform)
  invoice-preview.tsx           # Visual receipt component
  invoice-preview-modal.tsx     # Modal wrapper + browser-print button (web only)
  language-toggle.tsx           # Header pill: 🌐 العربية / Nederlands
  menu-item-card.tsx
  order-row.tsx                 # Single row in orders list
  order-type-badge.tsx          # Dine-in / Takeaway pill
  admin/
    pin-gate.tsx                # Numeric PIN entry with shake on error
    category-form-modal.tsx     # Add/edit category bottom sheet
    item-form-modal.tsx         # Add/edit menu item bottom sheet
    change-pin-modal.tsx        # Old PIN + new PIN
hooks/
  use-menu.ts                   # Categories + items, refetches on focus
  use-orders.ts                 # useOrders(dateFilter) + useOrderDetail(id)
lib/
  supabase.ts                   # Supabase client + Order/MenuItem/Category types
  config.ts                     # Restaurant config + APP_CONFIG (defaults, PIN)
  i18n.ts                       # i18next setup (AR + NL), RTL helper, currency formatter
  theme.ts                      # Colors, radii, spacing, shadows, web max-width
  printer.ts                    # printInvoice() placeholder — console.logs formatted text
  invoice-format.ts             # 32-char monospace receipt builder (per-language)
  basket.ts                     # Zustand basket store
  admin-auth.ts                 # Zustand admin auth store + AsyncStorage-backed PIN
  feedback.ts                   # showInfo / confirmAction — cross-platform Alert helpers
  db.ts                         # Typed Supabase queries (CRUD + create_order RPC)
locales/
  ar.json
  nl.json
supabase/
  migrations/
    0001_init.sql               # Tables, indexes, next_daily_order_number, create_order RPC
    0002_seed.sql               # Sample categories + items
    0003_order_type_and_tax.sql # Adds order_type + subtotal/tax_rate/tax_amount
    0004_invoice_language.sql   # Adds invoice_lang
```

## Database schema

Tables (final shape after all migrations):

- `categories(id, name_ar, name_nl, sort_order)`
- `menu_items(id, category_id, name_ar, name_nl, price, is_available, sort_order)`
- `orders(id, daily_number, order_date, status, order_type, invoice_lang, subtotal, tax_rate, tax_amount, total, created_at)`
- `order_items(id, order_id, menu_item_id, name_ar_snapshot, name_nl_snapshot, quantity, unit_price)`

**Order numbering**: `daily_number` resets each calendar day. The Postgres function `next_daily_order_number(today date)` computes `MAX(daily_number)+1 WHERE order_date = today` atomically. The unique `(order_date, daily_number)` constraint is the real safety; `create_order` retries up to 5× on collision. Display is `#001`, `#002`, etc., zero-padded in the UI only.

**Tax**: `order_type` is `'dine_in'` or `'takeaway'`. `create_order(items, order_type, invoice_lang)` is **server-authoritative** for tax — the rate is looked up inside the function (12% for dine-in, 6% for takeaway), not passed by the client. `tax_rate` is stored per row so changing rates later won't rewrite history. Menu prices are pre-tax; `total = subtotal + tax_amount`. The basket UI shows a live preview using `TAX_RATES` in `lib/db.ts` — keep both in sync if rates change.

**Invoice language**: `orders.invoice_lang` is `'ar'` or `'nl'`, picked at confirm time by the waiter. The invoice prints in only that one language. Reprints from history default to `order.invoice_lang` but can be flipped per reprint via the language pills on the order detail screen.

**Snapshots**: `order_items.name_*_snapshot` and `unit_price` are copied at order time so editing/deleting a menu item never alters historical orders.

**RLS**: All four tables have RLS enabled with permissive `anon all` policies — fine for the single-tablet, single-trusted-device deployment. Lock these down further if you ever expose the project beyond the tablet.

## i18n + RTL

- `lib/i18n.ts` initializes i18next with `ar` and `nl` namespaces from `locales/`.
- Language is persisted in AsyncStorage under `latakia.language`.
- **Default app language is Arabic** (`APP_CONFIG.defaultLanguage` in `lib/config.ts`). On first launch the UI is in AR and RTL.
- **Default invoice language is Dutch** (`APP_CONFIG.defaultInvoiceLanguage`). Independent from the app UI — most customers in NL want a Dutch receipt regardless of which language the waiter is using. Waiter can flip per order in the basket.
- `app/_layout.tsx` calls `I18nManager.forceRTL(lang === 'ar')` and reloads via `Updates.reloadAsync()` if the direction changed (RN requires a reload to flip RTL). On web, RTL flip is a no-op — verify RTL on a real device.
- `LanguageToggle` (header pill, top-right of every tab) flips between AR and NL.
- **Every visible string MUST go through `t('key')`** — no hardcoded UI text.

## Cross-platform feedback (`lib/feedback.ts`)

React Native Web's `Alert.alert` only honors the **single-button** form — passing a buttons array silently drops the destructive callback. So delete confirms didn't work on web. Use these helpers everywhere instead of importing `Alert` directly:

- `showInfo(message, title?)` → `window.alert` on web (deferred one tick so a closing Modal doesn't eat it), `Alert.alert` on native.
- `confirmAction({ title, message, confirmLabel, cancelLabel, destructive })` → `window.confirm` on web, multi-button `Alert.alert` on native. Returns `Promise<boolean>`.

## Env vars

Copy `.env.example` → `.env` (already done in this repo). All `EXPO_PUBLIC_*` vars are inlined into the JS bundle at build time:

- `EXPO_PUBLIC_SUPABASE_URL` — bare project URL, e.g. `https://xxx.supabase.co` (NO `/rest/v1/` suffix — supabase-js appends it itself)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_ADMIN_PIN` (4 digits — factory default; AsyncStorage value wins once changed)

The PIN being in the bundle is acceptable for this deployment (single-tablet, physical access required, no public distribution).

## Common commands

```bash
npm install                                # install deps
npx expo start                             # dev server (scan QR with Expo Go on tablet)
npx expo start --web                       # browser dev (fastest iteration; RTL flip is a no-op here)
npx expo start --tunnel                    # if device + dev box aren't on the same WiFi
npx expo start --android                   # run on connected Android device/emulator
npx expo lint                              # eslint
npx tsc --noEmit                           # typecheck (we don't ship a `typecheck` script)
eas build -p android --profile preview     # build APK for tablet install
```

For Supabase schema changes: write a new file in `supabase/migrations/` (numbered next-after-0004) and paste it into the Supabase SQL editor (we don't use the Supabase CLI in this repo — single dev, single environment).

## Printer

`lib/printer.ts` exports `printInvoice(invoice)` which currently console.logs the formatted receipt text (built by `formatInvoiceText` in `lib/invoice-format.ts`) — the same string a real ESC/POS printer would receive over Bluetooth/WiFi.

**Three ways to verify the layout right now:**
1. **Terminal log** — every confirm/reprint prints between `BEGIN RECEIPT` / `END RECEIPT` markers in monospace.
2. **Browser print button** (web only) — orange amber button in the preview modal opens a new window and triggers `window.print()`. Print to any USB/network printer to validate the layout on real paper.
3. **Visual modal** — the `InvoicePreview` component renders the receipt visually inside the app on every confirm/reprint.

When the real printer brand is confirmed, only `lib/printer.ts` needs to change — call sites stay identical (`await printInvoice(invoice)`).

## Conventions

- **Currency**: stored as `numeric(10,2)` in DB; format with `Intl.NumberFormat` in `lib/i18n.ts` (`formatPrice`). Currency code lives in `lib/config.ts` (`EUR`).
- **Dates**: store as `timestamptz` (UTC). Display in the tablet's local zone.
- **No `console.log` in committed code** except `lib/printer.ts` (intentional placeholder for the real printer).
- **No raw `Alert.alert`** — use `showInfo` / `confirmAction` from `lib/feedback.ts` so it works on web too.
- **Don't add features the spec doesn't request** — no kitchen screen, no waiter login, no analytics, no online ordering.
- **Editing existing menu items must not break history** — that's why `order_items` snapshots name + price.
- **List screens that show after-write data** (orders, admin lists) use `useFocusEffect` to refetch on focus so changes appear immediately when navigating back.

## What this app intentionally does NOT have

- No user accounts, no waiter IDs, no Supabase Auth
- No kitchen display screen (printer replaces it)
- No payment integration
- No multi-restaurant / multi-tenant support
- No offline mode (tablet is assumed online)
- No analytics or reporting beyond per-day revenue
