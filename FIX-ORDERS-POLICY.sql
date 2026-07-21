-- Run once in Supabase SQL Editor
alter table public.orders enable row level security;

drop policy if exists "public create orders" on public.orders;
drop policy if exists "anon insert orders" on public.orders;

create policy "public create orders"
on public.orders
for insert
to anon, authenticated
with check (true);

grant usage on schema public to anon, authenticated;
grant insert on public.orders to anon, authenticated;
