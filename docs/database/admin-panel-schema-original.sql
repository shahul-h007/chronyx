-- Drop existing tables to start fresh (for dev purposes)
drop table if exists "public"."order_items";
drop table if exists "public"."orders";
drop table if exists "public"."product_images";
drop table if exists "public"."products";
drop table if exists "public"."settings";
drop table if exists "public"."coupons";
drop table if exists "public"."waitlist";

-- 1. Products Table
create table "public"."products" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "price" numeric not null default 0,
    "category" text,
    "tags" text[],
    "stock_quantity" integer not null default 0,
    "is_live" boolean not null default false,
    "is_limited_drop" boolean not null default false,
    "drop_date" timestamp with time zone,
    "video_url" text,
    "video_embed_url" text,
    "video_thumbnail_url" text,
    "video_title" text,
    "video_description" text,
    "video_duration_seconds" integer,
    "video_upload_date" timestamp with time zone,
    "video_view_count" integer default 0,
    "video_transcript" text,
    "video_srt_url" text,
    "created_at" timestamp with time zone not null default now(),
    "attributes" jsonb DEFAULT '{}'::jsonb,
    primary key ("id")
);

-- 2. Product Images Table
create table "public"."product_images" (
    "id" uuid not null default gen_random_uuid(),
    "product_id" uuid not null references public.products(id) on delete cascade,
    "image_url" text not null,
    "is_hero" boolean not null default false,
    "sort_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    primary key ("id")
);

-- 3. Orders Table
create table "public"."orders" (
    "id" uuid not null default gen_random_uuid(),
    "customer_name" text not null,
    "customer_email" text not null,
    "shipping_address" jsonb,
    "total_amount" numeric not null default 0,
    "status" text not null default 'processing', -- processing, shipped, delivered, cancelled
    "tracking_number" text,
    "payment_method" text,
    "created_at" timestamp with time zone not null default now(),
    primary key ("id")
);

-- 4. Order Items Table
create table "public"."order_items" (
    "id" uuid not null default gen_random_uuid(),
    "order_id" uuid not null references public.orders(id) on delete cascade,
    "product_id" uuid not null references public.products(id) on delete restrict,
    "quantity" integer not null default 1,
    "price_at_time" numeric not null,
    primary key ("id")
);

-- 5. Settings / Content CMS Table
create table "public"."settings" (
    "key" text not null,
    "value" jsonb not null,
    "updated_at" timestamp with time zone not null default now(),
    primary key ("key")
);

-- 6. Coupons Table
create table "public"."coupons" (
    "id" uuid not null default gen_random_uuid(),
    "code" text not null unique,
    "discount_type" text not null, -- percentage or fixed
    "discount_value" numeric not null,
    "expiry_date" timestamp with time zone,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    primary key ("id")
);

-- 7. Waitlist / Newsletter Table
create table "public"."waitlist" (
    "id" uuid not null default gen_random_uuid(),
    "email" text not null unique,
    "product_id" uuid references public.products(id) on delete cascade, -- optional, if waiting for specific drop
    "is_newsletter" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    primary key ("id")
);

-- Insert some default settings
insert into "public"."settings" ("key", "value") values 
('hero_text', '{"headline": "Precision in Every Second", "subtext": "Masterpieces crafted from raw ash wood."}'),
('store_settings', '{"maintenance_mode": false, "cod_enabled": true, "free_shipping_threshold": 50000}');

-- Set up Row Level Security (RLS)
-- For the Admin Panel, we will authenticate the admin user.
-- For now, allow public read/write to quickly build the prototype (WARNING: Secure this before going live)
alter table "public"."products" enable row level security;
alter table "public"."product_images" enable row level security;
alter table "public"."orders" enable row level security;
alter table "public"."order_items" enable row level security;
alter table "public"."settings" enable row level security;
alter table "public"."coupons" enable row level security;
alter table "public"."waitlist" enable row level security;

create policy "Enable all access for all users" on "public"."products" for all using (true) with check (true);
create policy "Enable all access for all users" on "public"."product_images" for all using (true) with check (true);
create policy "Enable all access for all users" on "public"."orders" for all using (true) with check (true);
create policy "Enable all access for all users" on "public"."order_items" for all using (true) with check (true);
create policy "Enable all access for all users" on "public"."settings" for all using (true) with check (true);
create policy "Enable all access for all users" on "public"."coupons" for all using (true) with check (true);
create policy "Enable all access for all users" on "public"."waitlist" for all using (true) with check (true);
