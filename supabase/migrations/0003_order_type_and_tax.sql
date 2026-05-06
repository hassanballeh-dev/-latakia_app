-- Add order_type + tax breakdown to orders.
-- Rates: dine_in = 12%, takeaway = 6%. Server-authoritative (rate is looked up
-- inside create_order, not passed by the client). tax_rate is stored per row
-- so changing rates later doesn't rewrite history.

-- 1) Schema changes
alter table public.orders
  add column if not exists order_type  text          not null default 'dine_in'
    check (order_type in ('dine_in', 'takeaway')),
  add column if not exists subtotal    numeric(10,2) not null default 0
    check (subtotal >= 0),
  add column if not exists tax_rate    numeric(5,4)  not null default 0
    check (tax_rate >= 0 and tax_rate <= 1),
  add column if not exists tax_amount  numeric(10,2) not null default 0
    check (tax_amount >= 0);

-- Backfill any pre-existing orders (from before this migration) so totals stay
-- consistent: treat them as dine_in @ 12% and recompute subtotal from total.
update public.orders
   set order_type = 'dine_in',
       tax_rate   = 0.12,
       subtotal   = round(total / 1.12, 2),
       tax_amount = total - round(total / 1.12, 2)
 where tax_rate = 0
   and total    > 0;

-- Drop the temporary defaults — going forward, create_order must supply these.
alter table public.orders
  alter column order_type drop default,
  alter column subtotal   drop default,
  alter column tax_rate   drop default,
  alter column tax_amount drop default;

-- 2) Replace create_order to take order_type and compute tax server-side
create or replace function public.create_order(items jsonb, order_type text default 'dine_in')
returns public.orders
language plpgsql
as $$
declare
  new_order        public.orders;
  today            date := current_date;
  attempt          int  := 0;
  computed_subtotal numeric(10, 2);
  rate             numeric(5, 4);
  computed_tax     numeric(10, 2);
  computed_total   numeric(10, 2);
begin
  if items is null or jsonb_array_length(items) = 0 then
    raise exception 'order must contain at least one item';
  end if;

  if order_type not in ('dine_in', 'takeaway') then
    raise exception 'order_type must be dine_in or takeaway, got %', order_type;
  end if;

  -- Tax rates live HERE (single source of truth on the server).
  rate := case order_type
            when 'dine_in'  then 0.12
            when 'takeaway' then 0.06
          end;

  select coalesce(sum( (mi.price) * ((it->>'quantity')::int) ), 0)
    into computed_subtotal
    from jsonb_array_elements(items) as it
    join public.menu_items mi on mi.id = (it->>'menu_item_id')::uuid;

  computed_tax   := round(computed_subtotal * rate, 2);
  computed_total := computed_subtotal + computed_tax;

  -- Insert with retry on unique-violation (concurrent inserts same day)
  loop
    attempt := attempt + 1;
    begin
      insert into public.orders (order_date, daily_number, order_type, subtotal, tax_rate, tax_amount, total)
        values (today, public.next_daily_order_number(today),
                order_type, computed_subtotal, rate, computed_tax, computed_total)
        returning * into new_order;
      exit;
    exception when unique_violation then
      if attempt >= 5 then raise; end if;
    end;
  end loop;

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
