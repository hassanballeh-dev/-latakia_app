-- LATAKIA initial schema
-- Run this in the Supabase SQL editor for a fresh project.

create extension if not exists "pgcrypto";

-- ============================================================
-- categories
-- ============================================================
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name_ar     text not null,
  name_nl     text not null,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists categories_sort_idx on public.categories (sort_order);

-- ============================================================
-- menu_items
-- ============================================================
create table if not exists public.menu_items (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references public.categories(id) on delete cascade,
  name_ar       text not null,
  name_nl       text not null,
  price         numeric(10, 2) not null check (price >= 0),
  is_available  boolean not null default true,
  sort_order    int     not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists menu_items_category_idx on public.menu_items (category_id, sort_order);

-- ============================================================
-- orders
-- daily_number resets each calendar day (display as #001, #002...)
-- order_date is stored separately so the unique index works in any zone
-- ============================================================
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  order_date    date not null default current_date,
  daily_number  int  not null,
  status        text not null default 'confirmed' check (status in ('confirmed','cancelled')),
  total         numeric(10, 2) not null check (total >= 0),
  created_at    timestamptz not null default now(),
  unique (order_date, daily_number)
);

create index if not exists orders_date_idx     on public.orders (order_date desc, daily_number desc);
create index if not exists orders_created_idx  on public.orders (created_at desc);

-- ============================================================
-- order_items
-- name + price are SNAPSHOT at order time so editing the menu later
-- never mutates historical orders.
-- ============================================================
create table if not exists public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders(id) on delete cascade,
  menu_item_id      uuid references public.menu_items(id) on delete set null,
  name_ar_snapshot  text not null,
  name_nl_snapshot  text not null,
  unit_price        numeric(10, 2) not null check (unit_price >= 0),
  quantity          int  not null check (quantity > 0)
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- ============================================================
-- next_daily_order_number(today date) -> int
-- Atomic next-number-for-day calculator. The unique (order_date, daily_number)
-- constraint is the real safety net; this function just computes the value.
-- ============================================================
create or replace function public.next_daily_order_number(today date)
returns int
language plpgsql
as $$
declare
  next_num int;
begin
  select coalesce(max(daily_number), 0) + 1
    into next_num
    from public.orders
    where order_date = today;
  return next_num;
end;
$$;

-- ============================================================
-- create_order(items jsonb) -> orders
-- One-shot RPC: client sends [{menu_item_id, quantity}], server snapshots
-- name + price from menu_items, computes total + daily_number, inserts both
-- the order row and the order_items rows in a single transaction.
-- Retries on unique-constraint collision (other tablet inserted same number).
-- ============================================================
create or replace function public.create_order(items jsonb)
returns public.orders
language plpgsql
as $$
declare
  new_order  public.orders;
  today      date := current_date;
  attempt    int  := 0;
  computed_total numeric(10, 2);
begin
  -- Validate input
  if items is null or jsonb_array_length(items) = 0 then
    raise exception 'order must contain at least one item';
  end if;

  -- Compute total from current menu prices (server-authoritative)
  select coalesce(sum( (mi.price) * ((it->>'quantity')::int) ), 0)
    into computed_total
    from jsonb_array_elements(items) as it
    join public.menu_items mi on mi.id = (it->>'menu_item_id')::uuid;

  -- Insert with retry on unique-violation (concurrent inserts same day)
  loop
    attempt := attempt + 1;
    begin
      insert into public.orders (order_date, daily_number, total)
        values (today, public.next_daily_order_number(today), computed_total)
        returning * into new_order;
      exit;
    exception when unique_violation then
      if attempt >= 5 then raise; end if;
    end;
  end loop;

  -- Insert order_items with snapshots
  insert into public.order_items (order_id, menu_item_id, name_ar_snapshot, name_nl_snapshot, unit_price, quantity)
  select new_order.id,
         mi.id,
         mi.name_ar,
         mi.name_nl,
         mi.price,
         (it->>'quantity')::int
    from jsonb_array_elements(items) as it
    join public.menu_items mi on mi.id = (it->>'menu_item_id')::uuid;

  return new_order;
end;
$$;

-- ============================================================
-- Row-level security
-- This app uses the anon key from a single trusted tablet; RLS is enabled
-- but with permissive policies. Lock these down further if you ever expose
-- the Supabase project beyond the tablet.
-- ============================================================
alter table public.categories  enable row level security;
alter table public.menu_items  enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

create policy "anon all categories"  on public.categories  for all to anon using (true) with check (true);
create policy "anon all menu_items"  on public.menu_items  for all to anon using (true) with check (true);
create policy "anon all orders"      on public.orders      for all to anon using (true) with check (true);
create policy "anon all order_items" on public.order_items for all to anon using (true) with check (true);
