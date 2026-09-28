-- Schema for product reviews
create table if not exists public.product_reviews (
  id uuid default gen_random_uuid() primary key,
  product_id text not null,
  customer_email text not null,
  customer_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  status text default 'approved' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security
alter table public.product_reviews enable row level security;

-- Policy: Anyone can read approved reviews
create policy "Anyone can read approved reviews"
  on public.product_reviews for select
  using (status = 'approved');

-- Policy: Authenticated users can insert their own reviews
create policy "Authenticated users can insert reviews"
  on public.product_reviews for insert
  with check (auth.role() = 'authenticated' and auth.jwt() ->> 'email' = customer_email);

-- Policy: Authenticated users can edit their own reviews
drop policy if exists "Authenticated users can update own reviews" on public.product_reviews;
create policy "Authenticated users can update own reviews"
  on public.product_reviews for update
  using (auth.role() = 'authenticated' and lower(auth.jwt() ->> 'email') = lower(customer_email))
  with check (auth.role() = 'authenticated' and lower(auth.jwt() ->> 'email') = lower(customer_email));

-- Index for faster querying by product
create index if not exists idx_product_reviews_product_id on public.product_reviews(product_id);

-- Keep one review per customer per product
delete from public.product_reviews pr
using (
  select id,
    row_number() over (
      partition by product_id, lower(customer_email)
      order by updated_at desc nulls last, created_at desc nulls last, id desc
    ) as duplicate_rank
  from public.product_reviews
) ranked
where pr.id = ranked.id
  and ranked.duplicate_rank > 1;

create unique index if not exists idx_product_reviews_unique_customer_product
  on public.product_reviews (product_id, lower(customer_email));
