-- IBRAQ Store: run this entire file once in Supabase SQL Editor.

alter table public.products add column if not exists badge_ar text default '';
alter table public.products add column if not exists badge_en text default '';
alter table public.products add column if not exists visible boolean not null default true;
alter table public.products add column if not exists sort_order integer not null default 0;
alter table public.products alter column images set default '{}';

alter table public.products enable row level security;
alter table public.orders enable row level security;

-- Public store: read visible products only.
drop policy if exists "public read visible products" on public.products;
create policy "public read visible products"
on public.products for select
to anon, authenticated
using (visible = true or auth.role() = 'authenticated');

-- Logged-in admin: create, edit, and delete products.
drop policy if exists "authenticated insert products" on public.products;
create policy "authenticated insert products"
on public.products for insert
to authenticated
with check (true);

drop policy if exists "authenticated update products" on public.products;
create policy "authenticated update products"
on public.products for update
to authenticated
using (true) with check (true);

drop policy if exists "authenticated delete products" on public.products;
create policy "authenticated delete products"
on public.products for delete
to authenticated
using (true);

-- Customers can create orders, but cannot read them.
drop policy if exists "public create orders" on public.orders;
create policy "public create orders"
on public.orders for insert
to anon, authenticated
with check (
  total >= 0
  and jsonb_typeof(items) = 'array'
  and char_length(customer_name) between 1 and 120
  and char_length(customer_phone) between 3 and 40
);

-- Logged-in admin can see, update, and delete orders.
drop policy if exists "authenticated read orders" on public.orders;
create policy "authenticated read orders"
on public.orders for select
to authenticated
using (true);

drop policy if exists "authenticated update orders" on public.orders;
create policy "authenticated update orders"
on public.orders for update
to authenticated
using (true) with check (true);

drop policy if exists "authenticated delete orders" on public.orders;
create policy "authenticated delete orders"
on public.orders for delete
to authenticated
using (true);

grant usage on schema public to anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant insert on public.orders to anon, authenticated;
grant select, update, delete on public.orders to authenticated;

-- Storage permissions for the public bucket product-images.
drop policy if exists "public view product images" on storage.objects;
create policy "public view product images"
on storage.objects for select
to public
using (bucket_id = 'product-images');

drop policy if exists "authenticated upload product images" on storage.objects;
create policy "authenticated upload product images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-images');

drop policy if exists "authenticated update product images" on storage.objects;
create policy "authenticated update product images"
on storage.objects for update
to authenticated
using (bucket_id = 'product-images')
with check (bucket_id = 'product-images');

drop policy if exists "authenticated delete product images" on storage.objects;
create policy "authenticated delete product images"
on storage.objects for delete
to authenticated
using (bucket_id = 'product-images');

create index if not exists products_visible_sort_idx on public.products (visible, sort_order);
create index if not exists orders_created_at_idx on public.orders (created_at desc);


-- Shared homepage configuration so edits persist on every device.
create table if not exists public.site_config (
  id integer primary key check (id = 1),
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.site_config enable row level security;
drop policy if exists "public read site config" on public.site_config;
create policy "public read site config" on public.site_config for select to anon, authenticated using (id = 1);
drop policy if exists "authenticated save site config" on public.site_config;
create policy "authenticated save site config" on public.site_config for all to authenticated using (id = 1) with check (id = 1);
grant select on public.site_config to anon, authenticated;
grant insert, update on public.site_config to authenticated;
insert into public.site_config(id,config) values (1,'{}'::jsonb) on conflict (id) do nothing;
