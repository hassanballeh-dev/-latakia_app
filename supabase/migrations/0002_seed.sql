-- Sample data so the menu screen has something to render before the admin
-- dashboard is built. Safe to skip in production.

with cat_food as (
  insert into public.categories (name_ar, name_nl, sort_order)
  values ('طعام', 'Eten', 1) returning id
),
cat_drinks as (
  insert into public.categories (name_ar, name_nl, sort_order)
  values ('مشروبات', 'Dranken', 2) returning id
),
cat_desserts as (
  insert into public.categories (name_ar, name_nl, sort_order)
  values ('حلويات', 'Desserts', 3) returning id
)
insert into public.menu_items (category_id, name_ar, name_nl, price, sort_order)
values
  ((select id from cat_food),     'شاورما دجاج',  'Kip shoarma',     12.50, 1),
  ((select id from cat_food),     'فلافل',         'Falafel',         9.00,  2),
  ((select id from cat_food),     'حمص',          'Hummus',          6.50,  3),
  ((select id from cat_drinks),   'شاي',           'Thee',            2.50,  1),
  ((select id from cat_drinks),   'قهوة',          'Koffie',          3.00,  2),
  ((select id from cat_drinks),   'ماء',           'Water',           1.50,  3),
  ((select id from cat_desserts), 'بقلاوة',        'Baklava',         4.50,  1),
  ((select id from cat_desserts), 'كنافة',         'Knafeh',          5.50,  2);
