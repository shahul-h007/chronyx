# CHRONYX Email Integration Setup

This project now includes two Supabase Edge Function source files:

- `send-marketing-email.ts`
- `send-contact-email.ts`

And the deploy-ready Supabase function folders:

- `supabase/functions/send-marketing-email/index.ts`
- `supabase/functions/send-contact-email/index.ts`

They are not live until you deploy them to Supabase.

## What each function does

### `send-marketing-email`
- sends campaign emails from the admin `Marketing` page
- supports these audience segments:
  - `all`
  - `subscribers`
  - `newsletter`
  - `waitlist`

### `send-contact-email`
- sends a support notification when the storefront contact form is submitted
- sends a confirmation email back to the customer

## Required Supabase secrets

Set these in Supabase Edge Function Secrets:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Recommended values:

- `RESEND_FROM_EMAIL`: a verified sender like `CHRONYX <hello@chronyx.in>`

## Deploy function names

Deploy these files under these function names:

- `send-marketing-email` from `send-marketing-email.ts`
- `send-contact-email` from `send-contact-email.ts`

If you are using the Supabase CLI, these are the exact commands:

```powershell
supabase login
supabase link --project-ref <your-project-ref>
supabase functions deploy send-marketing-email
supabase functions deploy send-contact-email
```

## Set secrets with Supabase CLI

```powershell
supabase secrets set RESEND_API_KEY=your_resend_api_key
supabase secrets set RESEND_FROM_EMAIL="CHRONYX <hello@chronyx.in>"
supabase secrets set SUPABASE_URL=https://your-project-ref.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

If you prefer the dashboard:

1. Open Supabase project
2. Go to `Edge Functions`
3. Open `Secrets`
4. Add the same four secrets there

## Frontend wiring already added

### Admin panel
- `admin-panel/src/pages/Marketing.jsx`
  - `Send Email Blast` now opens a real composer
  - it invokes `send-marketing-email`

### Storefront
- `src/pages/ContactPage.jsx`
  - after saving a contact message, it invokes `send-contact-email`
  - if the function is missing, the contact form still submits successfully

## Important note

The existing order confirmation flow in this repo is separate. There is also an older SQL-based Resend trigger file:

- `setup_resend_webhook.sql`

That file is now sanitized, but the newer edge-function path is cleaner for admin and contact email features.

## What to test after deployment

1. Submit the storefront contact form
2. Confirm support inbox receives the message
3. Confirm the customer gets an acknowledgement email
4. Open admin `Marketing`
5. Send a test campaign to a small audience
6. Apply a real verified Resend sender before any production blast
