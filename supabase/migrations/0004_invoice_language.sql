-- Per-order invoice language. Until now the receipt printed both languages on
-- the same paper; the client now wants to pick one language per order at
-- confirm time so the customer's receipt is in their language only.
--
-- Stored on the order so reprints from history use the same language as the
-- original print (otherwise reprints would default to the current app language
-- and could surprise the customer).

alter table public.orders
  add column if not exists invoice_lang text not null default 'nl'
    check (invoice_lang in ('ar', 'nl'));

-- Replace create_order to accept invoice_lang (defaults to 'nl' so existing
-- callers keep working until the client is updated).
create or replace function public.create_order(
  items jsonb,
  order_type text default 'dine_in',
  invoice_lang text default 'nl'
)
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

  if invoice_lang not in ('ar', 'nl') then
    raise exception 'invoice_lang must be ar or nl, got %', invoice_lang;
  end if;

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

  loop
    attempt := attempt + 1;
    begin
      insert into public.orders (order_date, daily_number, order_type, invoice_lang,
                                 subtotal, tax_rate, tax_amount, total)
        values (today, public.next_daily_order_number(today),
                order_type, invoice_lang,
                computed_subtotal, rate, computed_tax, computed_total)
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
