# Master Template Operations Manual
## Production Deployment, Maintenance & Client Provisioning Guide

**Template Version**: `1.0.0`  
**Schema Baseline**: `2026.10.0` (17 Authoritative Migrations)  
**Target Architecture**: Single-Tenant Client Deployments (Isolated Supabase + Vercel)

---

## 1. System Architecture Overview

This project is a modular, high-performance E-Commerce Master Template designed for single-tenant, independent deployments. It provides complete data, security, and infrastructure isolation across clients without multi-tenant database bloat or `business_id` overhead.

```
                  MASTER E-COMMERCE TEMPLATE (v1.0.0)
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
  CLIENT STORE 1            CLIENT STORE 2            CHRONYX BRAND
 (Own Repo + Vercel)       (Own Repo + Vercel)       (Own Repo + Vercel)
         │                         │                         │
         ▼                         ▼                         ▼
  SUPABASE PROJECT 1        SUPABASE PROJECT 2        SUPABASE PROJECT
 (Isolated DB + Auth)      (Isolated DB + Auth)      (Isolated DB + Auth)
```

---

## 2. Fast-Track Client Provisioning (CLI)

To onboard a brand-new client:

```bash
# Interactive Provisioning
npm run provision-client

# Non-Interactive / Scripted Provisioning
npm run provision-client -- \
  --name "Acme Home" \
  --domain "acmehome.example" \
  --email "hello@acmehome.example" \
  --currency "USD" \
  --currency-symbol "$" \
  --locale "en-US" \
  --theme "minimal" \
  --payment-gateway "offline" \
  --capabilities "reviews:true,coupons:true,journal:false,wishlist:false,productVerification:false" \
  --non-interactive
```

---

## 3. Database & Migration Management

### 3.1 Migration Sequence
The database schema is defined by 17 immutable, sequentially ordered SQL migrations located in `supabase/migrations/`:

1. `000_base_products.sql`: Core products & product_images tables.
2. `001_initial_schema.sql`: Settings, orders, subscribers, coupons, waitlist, contact_messages.
3. `002_orders_patch.sql`: Orders columns expansion.
4. `003_product_extra_fields.sql`: Product attributes & physical specifications.
5. `004_product_video_fields.sql`: Video schema fields.
6. `005_admin_users.sql`: `admin_users` table and `public.is_admin()` security function.
7. `006_authenticity_units.sql`: Optional serial units and authenticity verification RPC.
8. `007_blog_posts.sql`: Journal/blog posts table and policies.
9. `008_collections.sql`: Catalog collections and relationship mapping.
10. `009_seo_overrides.sql`: Dynamic per-route metadata overrides.
11. `010_product_reviews.sql`: Customer reviews and star ratings.
12. `011_product_reviews_unique_constraint.sql`: Deduplication indexes for reviews.
13. `012_hardened_rls.sql`: Hardened Row-Level Security across all 10 core tables.
14. `013_stock_decrement_rpc.sql`: Atomic inventory decrement RPC (`decrement_stock`).
15. `014_stock_increment_rpc.sql`: Atomic inventory replenishment RPC (`increment_stock`).
16. `015_resend_webhook.sql`: Database transactional email webhook trigger.
17. `016_product_attributes.sql`: Unified JSONB product attributes column.

### 3.2 Applying Migrations to Fresh Database
```bash
# Option A: Supabase CLI (Recommended)
supabase db push

# Option B: Bundle generation for Supabase Dashboard SQL Editor
npm run provision-supabase -- --bundle > migrations_bundle.sql
# Paste output into Supabase Studio -> SQL Editor -> Run
```

### 3.3 Seeding Baseline Store Records
```bash
# Idempotently seed store_settings, navigation_content, footer, and policies
npm run seed-database -- \
  --store-name "Acme Home" \
  --domain "acmehome.example" \
  --email "hello@acmehome.example"
```

---

## 4. Storage & Media Provisioning

Image and media uploads for catalog items are powered by Cloudinary (unsigned preset) to minimize database egress and leverage global edge CDN image transformations.

### 4.1 Required Admin Configuration
In `admin-panel/.env`:
```env
VITE_CLOUDINARY_CLOUD_NAME="client_cloud_name"
VITE_CLOUDINARY_UPLOAD_PRESET="client_unsigned_preset"
```

### 4.2 Verifying Storage Setup
```bash
npm run provision-storage
```

---

## 5. First-Admin Account Bootstrap

The Master Template enforces database-level authorization via `public.is_admin()`, which checks whether `auth.jwt() ->> 'email'` exists in `public.admin_users`.

### 5.1 Safe Bootstrap Procedure
```bash
# Automated (requires server-side SUPABASE_SERVICE_ROLE_KEY)
npm run bootstrap-admin -- --email "owner@clientbrand.com"

# Manual Procedure (Without Service Role Key):
# 1. In Supabase Dashboard -> Authentication -> Users -> Add User (e.g. owner@clientbrand.com).
# 2. In Supabase Dashboard -> SQL Editor:
#    INSERT INTO public.admin_users (email) VALUES ('owner@clientbrand.com') ON CONFLICT DO NOTHING;
# 3. In admin-panel/.env:
#    VITE_ADMIN_EMAIL="owner@clientbrand.com"
```

---

## 6. Pre-Flight Verification & CI/CD Pipeline

Prior to deploying to Vercel or production infrastructure, run the preflight suite:

```bash
# Run complete preflight checks
npm run preflight
# or
npm run verify-deployment
```

### Checks Performed by Preflight:
1. **Configuration Integrity**: URL formats, JWT formats, ISO currency codes, BCP-47 locales.
2. **Theme System**: Verifies requested theme exists in theme registry and CSS bundle.
3. **Static Branding Assets**: Verifies `logo.svg`, `og-image.jpg`, `favicon.ico`, and alerts on demo assets.
4. **Payment Gateway Boundary**: Validates currency compatibility with configured gateway.
5. **Admin Panel Readiness**: Verifies admin structure and environment integrity.
6. **Storage & Media Readiness**: Verifies Cloudinary upload configuration.
7. **Security Isolation**: Asserts `.env` and secret tokens are strictly `.gitignore`d.

### Continuous Integration (GitHub Actions)
A production-grade CI workflow is configured at [`.github/workflows/ci.yml`](.github/workflows/ci.yml). Every push and pull request runs:
- `npm ci` & `npm --prefix admin-panel ci`
- `npm run validate-config`
- `npm run validate-assets`
- `npm test` (Unit test suite)
- `npm run preflight`
- Production builds for both Storefront and Admin Panel

---

## 7. Security Architecture & Boundaries

1. **Client-Side Environment**:
   - `VITE_*` variables are bundled directly into the browser.
   - **NEVER** expose `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, or `RESEND_API_KEY` in `VITE_*` variables.
2. **Row-Level Security (RLS)**:
   - All 10 public database tables have RLS enabled.
   - Public users can only read live/visible products, published blog posts, approved reviews, and public settings.
   - Insert/Update/Delete operations on products, collections, settings, and orders are restricted to verified admins via `public.is_admin()`.
3. **Atomic Stock Protection**:
   - Order fulfillment utilizes database RPCs (`decrement_stock`, `increment_stock`) to prevent race conditions during high-volume drops.

---

## 8. Rollback & Disaster Recovery

- **Database Rollback**: Point-in-time recovery is supported natively via Supabase Pro backups.
- **Storefront / Admin Rollback**: Instant one-click rollback to prior deployment commits via Vercel Dashboard.
- **Maintenance Mode**: To immediately take the store offline, toggle `maintenance_mode: true` in `settings` -> `store_settings` via Admin Panel or SQL.
