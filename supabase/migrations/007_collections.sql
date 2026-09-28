create table if not exists public.collections (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text not null unique,
  subtitle text default '',
  description text default '',
  image_url text default '',
  is_visible boolean default true,
  is_featured_home boolean default false,
  is_featured_shop boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.collection_products (
  id uuid default gen_random_uuid() primary key,
  collection_id uuid not null references public.collections(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order integer default 0,
  created_at timestamptz default now(),
  unique (collection_id, product_id)
);

alter table public.collections enable row level security;
alter table public.collection_products enable row level security;

drop policy if exists "Public can read visible collections" on public.collections;
create policy "Public can read visible collections"
  on public.collections for select
  using (is_visible = true or auth.role() = 'authenticated');

drop policy if exists "Authenticated users can manage collections" on public.collections;
create policy "Authenticated users can manage collections"
  on public.collections for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Public can read collection products" on public.collection_products;
create policy "Public can read collection products"
  on public.collection_products for select
  using (true);

drop policy if exists "Authenticated users can manage collection products" on public.collection_products;
create policy "Authenticated users can manage collection products"
  on public.collection_products for all
  to authenticated
  using (true)
  with check (true);
