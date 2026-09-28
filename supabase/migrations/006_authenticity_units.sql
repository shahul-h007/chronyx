create table if not exists public.product_auth_units (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  serial_number integer not null,
  public_unit_id text not null unique,
  authenticity_code text not null unique,
  status text not null default 'available' check (status in ('available', 'assigned', 'archived')),
  order_id uuid references public.orders(id) on delete set null,
  assigned_to_email text,
  assigned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, serial_number)
);

alter table public.product_auth_units
  add column if not exists order_id uuid references public.orders(id) on delete set null;

alter table public.product_auth_units
  add column if not exists assigned_to_email text;

alter table public.product_auth_units
  add column if not exists assigned_at timestamptz;

create index if not exists idx_product_auth_units_product_id
  on public.product_auth_units(product_id);

create index if not exists idx_product_auth_units_public_unit_id
  on public.product_auth_units(public_unit_id);

alter table public.product_auth_units enable row level security;

drop policy if exists "Public can read product authenticity units" on public.product_auth_units;
drop policy if exists "Authenticated users can manage product authenticity units" on public.product_auth_units;
drop policy if exists "Admins can read product authenticity units" on public.product_auth_units;
drop policy if exists "Admins can insert product authenticity units" on public.product_auth_units;
drop policy if exists "Admins can update product authenticity units" on public.product_auth_units;
drop policy if exists "Admins can delete product authenticity units" on public.product_auth_units;

create policy "Admins can read product authenticity units"
  on public.product_auth_units for select
  to authenticated
  using (public.is_admin());

create policy "Admins can insert product authenticity units"
  on public.product_auth_units for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update product authenticity units"
  on public.product_auth_units for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete product authenticity units"
  on public.product_auth_units for delete
  to authenticated
  using (public.is_admin());

create or replace function public.verify_product_auth_unit(
  lookup_public_unit_id text,
  lookup_authenticity_code text
)
returns table (
  public_unit_id text,
  product_id uuid,
  serial_number integer,
  status text,
  assigned_at timestamptz,
  verified boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    unit.public_unit_id,
    unit.product_id,
    unit.serial_number,
    unit.status,
    unit.assigned_at,
    unit.authenticity_code = lookup_authenticity_code
      and unit.status <> 'archived' as verified
  from public.product_auth_units unit
  where unit.public_unit_id = lookup_public_unit_id
  limit 1;
$$;

grant execute on function public.verify_product_auth_unit(text, text) to anon, authenticated;
