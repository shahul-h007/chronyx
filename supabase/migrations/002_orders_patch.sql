-- Run this in your Supabase SQL Editor to add the missing columns to the orders table

ALTER TABLE "public"."orders" 
ADD COLUMN IF NOT EXISTS "items" jsonb,
ADD COLUMN IF NOT EXISTS "shipping_address" jsonb,
ADD COLUMN IF NOT EXISTS "payment_method" text,
ADD COLUMN IF NOT EXISTS "razorpay_payment_id" text,
ADD COLUMN IF NOT EXISTS "total" numeric;
