-- ============================================================
-- CHRONYX: hardened Row-Level Security policies
-- ============================================================
-- Run this in Supabase SQL Editor after the base schema exists.
--
-- Admin access is enforced in the database through public.admin_users.
-- Add the store owner before relying on the admin panel:
--
--   insert into public.admin_users (email) values ('chronyxbrand@gmail.com')
--   on conflict (email) do nothing;
-- ============================================================

create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

grant execute on function public.is_admin() to authenticated;

drop policy if exists "Admins can read admin users" on public.admin_users;
create policy "Admins can read admin users"
  on public.admin_users for select
  to authenticated
  using (public.is_admin());

-- PRODUCTS
alter table public.products enable row level security;

drop policy if exists "Public can read products" on public.products;
drop policy if exists "Authenticated users can insert products" on public.products;
drop policy if exists "Authenticated users can update products" on public.products;
drop policy if exists "Authenticated users can delete products" on public.products;
drop policy if exists "Admins can insert products" on public.products;
drop policy if exists "Admins can update products" on public.products;
drop policy if exists "Admins can delete products" on public.products;

create policy "Public can read products"
  on public.products for select
  using (true);

create policy "Admins can insert products"
  on public.products for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update products"
  on public.products for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete products"
  on public.products for delete
  to authenticated
  using (public.is_admin());

-- PRODUCT_IMAGES
alter table public.product_images enable row level security;

drop policy if exists "Public can read product images" on public.product_images;
drop policy if exists "Authenticated users can insert product images" on public.product_images;
drop policy if exists "Authenticated users can update product images" on public.product_images;
drop policy if exists "Authenticated users can delete product images" on public.product_images;
drop policy if exists "Admins can insert product images" on public.product_images;
drop policy if exists "Admins can update product images" on public.product_images;
drop policy if exists "Admins can delete product images" on public.product_images;

create policy "Public can read product images"
  on public.product_images for select
  using (true);

create policy "Admins can insert product images"
  on public.product_images for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update product images"
  on public.product_images for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete product images"
  on public.product_images for delete
  to authenticated
  using (public.is_admin());

-- ORDERS
alter table public.orders enable row level security;

drop policy if exists "Authenticated users can read orders" on public.orders;
drop policy if exists "Anyone can insert orders" on public.orders;
drop policy if exists "Authenticated users can update orders" on public.orders;
drop policy if exists "Customers can read own orders" on public.orders;
drop policy if exists "Admins can read all orders" on public.orders;
drop policy if exists "Admins can insert orders" on public.orders;
drop policy if exists "Admins can update orders" on public.orders;

create policy "Customers can read own orders"
  on public.orders for select
  to authenticated
  using (lower(customer_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

create policy "Admins can read all orders"
  on public.orders for select
  to authenticated
  using (public.is_admin());

create policy "Admins can insert orders"
  on public.orders for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update orders"
  on public.orders for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- SETTINGS
alter table public.settings enable row level security;

drop policy if exists "Public can read settings" on public.settings;
drop policy if exists "Authenticated users can insert settings" on public.settings;
drop policy if exists "Authenticated users can update settings" on public.settings;
drop policy if exists "Admins can insert settings" on public.settings;
drop policy if exists "Admins can update settings" on public.settings;

create policy "Public can read settings"
  on public.settings for select
  using (true);

create policy "Admins can insert settings"
  on public.settings for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update settings"
  on public.settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- SUBSCRIBERS
alter table public.subscribers enable row level security;

drop policy if exists "Anyone can insert subscribers" on public.subscribers;
drop policy if exists "Authenticated users can read subscribers" on public.subscribers;
drop policy if exists "Admins can read subscribers" on public.subscribers;

create policy "Anyone can insert subscribers"
  on public.subscribers for insert
  with check (true);

create policy "Admins can read subscribers"
  on public.subscribers for select
  to authenticated
  using (public.is_admin());

-- COUPONS
alter table public.coupons enable row level security;

drop policy if exists "Authenticated users can read coupons" on public.coupons;
drop policy if exists "Authenticated users can insert coupons" on public.coupons;
drop policy if exists "Authenticated users can update coupons" on public.coupons;
drop policy if exists "Authenticated users can delete coupons" on public.coupons;
drop policy if exists "Admins can read coupons" on public.coupons;
drop policy if exists "Admins can insert coupons" on public.coupons;
drop policy if exists "Admins can update coupons" on public.coupons;
drop policy if exists "Admins can delete coupons" on public.coupons;

create policy "Admins can read coupons"
  on public.coupons for select
  to authenticated
  using (public.is_admin());

create policy "Admins can insert coupons"
  on public.coupons for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update coupons"
  on public.coupons for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete coupons"
  on public.coupons for delete
  to authenticated
  using (public.is_admin());

-- WAITLIST
alter table public.waitlist enable row level security;

drop policy if exists "Anyone can insert waitlist" on public.waitlist;
drop policy if exists "Authenticated users can read waitlist" on public.waitlist;
drop policy if exists "Admins can read waitlist" on public.waitlist;

create policy "Anyone can insert waitlist"
  on public.waitlist for insert
  with check (true);

create policy "Admins can read waitlist"
  on public.waitlist for select
  to authenticated
  using (public.is_admin());

-- CONTACT_MESSAGES
alter table public.contact_messages enable row level security;

drop policy if exists "Anyone can insert contact messages" on public.contact_messages;
drop policy if exists "Authenticated users can read contact messages" on public.contact_messages;
drop policy if exists "Authenticated users can update contact messages" on public.contact_messages;
drop policy if exists "Admins can read contact messages" on public.contact_messages;
drop policy if exists "Admins can update contact messages" on public.contact_messages;

create policy "Anyone can insert contact messages"
  on public.contact_messages for insert
  with check (true);

create policy "Admins can read contact messages"
  on public.contact_messages for select
  to authenticated
  using (public.is_admin());

create policy "Admins can update contact messages"
  on public.contact_messages for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
