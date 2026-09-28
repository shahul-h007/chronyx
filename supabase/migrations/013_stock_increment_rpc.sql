CREATE OR REPLACE FUNCTION increment_stock(product_id uuid, quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity + quantity
  WHERE id = product_id;
END;
$$;
