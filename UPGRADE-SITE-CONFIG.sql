-- Run this once if you already ran setup-supabase.sql before.
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
