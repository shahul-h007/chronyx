-- ============================================================
-- CHRONYX: Safe Stock Management
-- ============================================================
-- Run this in your Supabase SQL Editor.
-- This creates a secure function to decrease product stock 
-- when an order is placed, preventing race conditions.
-- ============================================================

CREATE OR REPLACE FUNCTION decrement_stock(product_id uuid, quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as admin to bypass RLS for this specific action
AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity - quantity
  WHERE id = product_id AND stock_quantity >= quantity;
  
  -- If you want to throw an error when out of stock:
  -- IF NOT FOUND THEN
  --   RAISE EXCEPTION 'Not enough stock for product %', product_id;
  -- END IF;
END;
$$;
