-- Prevent duplicate product reviews from the same customer.
-- Run this in Supabase SQL Editor.

alter table public.product_reviews
  add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now()) not null;

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

drop policy if exists "Authenticated users can update own reviews" on public.product_reviews;
create policy "Authenticated users can update own reviews"
  on public.product_reviews for update
  using (auth.role() = 'authenticated' and lower(auth.jwt() ->> 'email') = lower(customer_email))
  with check (auth.role() = 'authenticated' and lower(auth.jwt() ->> 'email') = lower(customer_email));

create unique index if not exists idx_product_reviews_unique_customer_product
  on public.product_reviews (product_id, lower(customer_email));
