-- Altai Catalog - شغّل هذا الملف كاملاً مرة واحدة داخل Supabase SQL Editor.
-- حساب الأدمن الوحيد: Altai0193@gmail.com

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null default '',
  name_en text not null default '',
  description_ar text not null default '',
  description_en text not null default '',
  code text not null default '',
  category text not null default 'all',
  price numeric(12,2) not null default 0 check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  badge_ar text not null default '',
  badge_en text not null default '',
  visible boolean not null default true,
  featured boolean not null default false,
  sort_order integer not null default 0,
  images text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products add column if not exists name_ar text not null default '';
alter table public.products add column if not exists name_en text not null default '';
alter table public.products add column if not exists description_ar text not null default '';
alter table public.products add column if not exists description_en text not null default '';
alter table public.products add column if not exists code text not null default '';
alter table public.products add column if not exists category text not null default 'all';
alter table public.products add column if not exists price numeric(12,2) not null default 0;
alter table public.products add column if not exists stock integer not null default 0;
alter table public.products add column if not exists badge_ar text not null default '';
alter table public.products add column if not exists badge_en text not null default '';
alter table public.products add column if not exists visible boolean not null default true;
alter table public.products add column if not exists featured boolean not null default false;
alter table public.products add column if not exists sort_order integer not null default 0;
alter table public.products add column if not exists images text[] not null default '{}'::text[];
alter table public.products add column if not exists created_at timestamptz not null default now();
alter table public.products add column if not exists updated_at timestamptz not null default now();

create table if not exists public.site_config (
  id integer primary key check (id = 1),
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.site_config (id, config) values (1, '{}'::jsonb) on conflict (id) do nothing;

create or replace function public.is_catalog_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'altai0193@gmail.com';
$$;

grant execute on function public.is_catalog_admin() to anon, authenticated;
alter table public.products enable row level security;
alter table public.site_config enable row level security;

-- إزالة السياسات القديمة الواسعة إن كانت النسخة السابقة مستخدمة.
drop policy if exists "public read visible products" on public.products;
drop policy if exists "authenticated insert products" on public.products;
drop policy if exists "authenticated update products" on public.products;
drop policy if exists "authenticated delete products" on public.products;
drop policy if exists "catalog public read products" on public.products;
drop policy if exists "catalog admin insert products" on public.products;
drop policy if exists "catalog admin update products" on public.products;
drop policy if exists "catalog admin delete products" on public.products;

create policy "catalog public read products"
on public.products for select
to anon, authenticated
using (visible = true or public.is_catalog_admin());

create policy "catalog admin insert products"
on public.products for insert
to authenticated
with check (public.is_catalog_admin());

create policy "catalog admin update products"
on public.products for update
to authenticated
using (public.is_catalog_admin())
with check (public.is_catalog_admin());

create policy "catalog admin delete products"
on public.products for delete
to authenticated
using (public.is_catalog_admin());

drop policy if exists "public read site config" on public.site_config;
drop policy if exists "authenticated save site config" on public.site_config;
drop policy if exists "catalog public read config" on public.site_config;
drop policy if exists "catalog admin insert config" on public.site_config;
drop policy if exists "catalog admin update config" on public.site_config;

create policy "catalog public read config"
on public.site_config for select
to anon, authenticated
using (id = 1);

create policy "catalog admin insert config"
on public.site_config for insert
to authenticated
with check (id = 1 and public.is_catalog_admin());

create policy "catalog admin update config"
on public.site_config for update
to authenticated
using (id = 1 and public.is_catalog_admin())
with check (id = 1 and public.is_catalog_admin());

grant usage on schema public to anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant select on public.site_config to anon, authenticated;
grant insert, update on public.site_config to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'catalog-media',
  'catalog-media',
  true,
  62914560,
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public view product images" on storage.objects;
drop policy if exists "authenticated upload product images" on storage.objects;
drop policy if exists "authenticated update product images" on storage.objects;
drop policy if exists "authenticated delete product images" on storage.objects;
drop policy if exists "catalog public read media" on storage.objects;
drop policy if exists "catalog admin upload media" on storage.objects;
drop policy if exists "catalog admin update media" on storage.objects;
drop policy if exists "catalog admin delete media" on storage.objects;

create policy "catalog public read media"
on storage.objects for select
to public
using (bucket_id = 'catalog-media');

create policy "catalog admin upload media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'catalog-media' and public.is_catalog_admin());

create policy "catalog admin update media"
on storage.objects for update
to authenticated
using (bucket_id = 'catalog-media' and public.is_catalog_admin())
with check (bucket_id = 'catalog-media' and public.is_catalog_admin());

create policy "catalog admin delete media"
on storage.objects for delete
to authenticated
using (bucket_id = 'catalog-media' and public.is_catalog_admin());

create index if not exists products_visible_sort_idx on public.products (visible, sort_order);
create index if not exists products_category_sort_idx on public.products (category, sort_order);
