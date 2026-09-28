-- ============================================================
-- CHRONYX: Resend Email Integration (via Database Webhook)
-- ============================================================
-- Run this in your Supabase SQL Editor.
-- This creates a trigger that automatically calls the Resend API
-- whenever a new row is inserted into the 'orders' table.
-- ============================================================

-- Ensure the pg_net extension is enabled (required for making HTTP requests)
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Create the function that will send the email
CREATE OR REPLACE FUNCTION public.send_order_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  resend_api_key text := 'REPLACE_WITH_RESEND_API_KEY'; -- Set a real key before using this SQL path
  admin_email text := 'hello@chronyx.in'; -- Update this to your real support inbox
  customer_payload jsonb;
  admin_payload jsonb;
  customer_email_html text;
  admin_email_html text;
BEGIN
  -- 1. Build the HTML email body for the CUSTOMER
  customer_email_html := '
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="text-align: center; color: #1a1a1a;">CHRONYX</h2>
      <p>Hi ' || NEW.customer_name || ',</p>
      <p>Thank you for your order! We are thrilled to craft your timepiece.</p>
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Order ID:</strong> ' || NEW.id || '</p>
        <p style="margin: 10px 0 0 0;"><strong>Total:</strong> ₹' || NEW.total || '</p>
      </div>
      <p>We will notify you once your order has shipped.</p>
      <p>Best regards,<br>The Chronyx Team</p>
    </div>
  ';

  -- Build the Resend API payload for Customer
  customer_payload := jsonb_build_object(
    'from', 'onboarding@resend.dev', -- Using Resend''s default testing domain
    'to', NEW.customer_email,
    'subject', 'Order Confirmation - Chronyx',
    'html', customer_email_html
  );

  -- Make the HTTP POST request to Resend for Customer
  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || resend_api_key,
      'Content-Type', 'application/json'
    ),
    body := customer_payload
  );

  -- 2. Build the HTML email body for the ADMIN
  admin_email_html := '
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">New Order Received!</h2>
      <p>A new order has been placed on Chronyx.</p>
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Order ID:</strong> ' || NEW.id || '</p>
        <p style="margin: 10px 0 0 0;"><strong>Customer:</strong> ' || NEW.customer_name || ' (' || NEW.customer_email || ')</p>
        <p style="margin: 10px 0 0 0;"><strong>Total:</strong> ₹' || NEW.total || '</p>
        <p style="margin: 10px 0 0 0;"><strong>Payment Method:</strong> ' || NEW.payment_method || '</p>
      </div>
      <p>Please check the admin panel for packing details.</p>
    </div>
  ';

  -- Build the Resend API payload for Admin
  admin_payload := jsonb_build_object(
    'from', 'onboarding@resend.dev',
    'to', admin_email,
    'subject', 'NEW ORDER ALERT: ₹' || NEW.total || ' - ' || NEW.customer_name,
    'html', admin_email_html
  );

  -- Make the HTTP POST request to Resend for Admin
  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || resend_api_key,
      'Content-Type', 'application/json'
    ),
    body := admin_payload
  );

  RETURN NEW;
END;
$$;

-- Create the trigger on the orders table
DROP TRIGGER IF EXISTS on_order_created ON public.orders;
CREATE TRIGGER on_order_created
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.send_order_confirmation();
