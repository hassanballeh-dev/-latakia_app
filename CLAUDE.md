# LATAKIA — Restaurant Waiter App

Single-tablet Android app for waiters: build basket → review → confirm → print thermal invoice → order saved to Supabase. No kitchen screen, no waiter accounts. Admin dashboard behind a 4-digit PIN.

---

## ⏯ Resume here (last session: May 2026)

**Status:** Phases 1 + 2 done. Phase 3 next.

**Done:**
- ✅ **Phase 1** — Expo Router scaffold, Supabase migration (`supabase/migrations/0001_init.sql` + `0002_seed.sql` already applied to the live project), `.env` configured with real credentials, i18n + RTL, `lib/` modules, tab skeleton (Menu / Orders / Admin), Supabase end-to-end verified (categories fetch + `create_order` RPC both 200).
- ✅ **Phase 2** — Menu screen (categories, item grid, refresh), basket FAB, basket modal with qty controls + confirm-and-print flow that actually inserts an order via `create_order` RPC and calls the printer placeholder.

**Pending (in order):**
- ⏳ **Phase 3** — Order history list (newest first), date filter, order detail screen, reprint button (still using printer placeholder).
- ⏳ **Phase 4** — Admin PIN gate, category CRUD, menu item CRUD with availability toggle, orders by date in admin, daily revenue total.
- ⏳ **Phase 5** — Bilingual invoice layout component (currently the printer just `console.log`s JSON; swap to a real layout when the printer brand is confirmed).

**To resume:**
1. `cd /home/LATAKIA && npx expo start` (or `--web` / `--tunnel`).
2. Confirm Phase 2 still works on tablet/web (menu loads, basket confirms, order appears in Supabase Table Editor).
3. Tell Claude: **"continue with Phase 3"**.

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

See `supabase/migrations/0001_init.sql`. Tables:

- `categories(id, name_ar, name_nl, sort_order)`
- `menu_items(id, category_id, name_ar, name_nl, price, is_available, sort_order)`
- `orders(id, daily_number, order_date, status, total, created_at)`
- `order_items(id, order_id, menu_item_id, name_ar_snapshot, name_nl_snapshot, quantity, unit_price)`

**Order numbering**: `daily_number` resets each calendar day. The Postgres function `next_daily_order_number(today date)` computes `MAX(daily_number)+1 WHERE order_date = today` atomically — safe even under concurrent inserts. Display is `#001`, `#002`, etc., zero-padded in the UI only.

**Snapshots**: `order_items.name_*_snapshot` and `unit_price` are copied at order time so editing/deleting a menu item never alters historical orders.

## i18n + RTL

- `lib/i18n.ts` initializes i18next with `ar` and `nl` namespaces from `locales/`.
- Language is persisted in AsyncStorage. Default is Dutch (`nl`).
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
