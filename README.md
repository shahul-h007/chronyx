# Chronyx — Master E-Commerce Template

[![CI & Deployment Preflight](https://github.com/shahul-h007/chronyx/actions/workflows/ci.yml/badge.svg)](https://github.com/shahul-h007/chronyx/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](src/config/templateVersion.js)
[![Database](https://img.shields.io/badge/supabase-PostgreSQL%2015-3ECF8E.svg?logo=supabase)](supabase/migrations)
[![Framework](https://img.shields.io/badge/storefront-React%2018%20%2B%20Vite-61DAFB.svg?logo=react)](src)
[![Admin](https://img.shields.io/badge/admin%20panel-Custom%20Vite%20SPA-orange.svg)](admin-panel)

An architectural, production-ready **Master E-Commerce Template** designed for high-end boutique brands, artisan studios, and direct-to-consumer (D2C) businesses. Built with React 18, Vite, Supabase, Tailwind/Vanilla Design Tokens, Lenis smooth scrolling, and automated PDF document generation.

> **Single-Tenant Deployment Model**: This is **not** a shared multi-tenant SaaS. Each client store deploys as an independent, fully isolated instance with its own GitHub repository, dedicated Supabase project, custom domain, and Vercel hosting.

---

## Table of Contents

- [Architectural Philosophy](#architectural-philosophy)
- [Key Features](#key-features)
- [Repository Structure](#repository-structure)
- [Quick Start & Local Development](#quick-start--local-development)
- [Client Provisioning CLI](#client-provisioning-cli)
- [Database & Migrations](#database--migrations)
- [First-Admin Account Bootstrap](#first-admin-account-bootstrap)
- [Capabilities System](#capabilities-system)
- [Themes & Customization](#themes--customization)
- [Payment Gateways & Currency](#payment-gateways--currency)
- [Preflight, Testing & CI/CD](#preflight-testing--cicd)
- [Deployment Runbook](#deployment-runbook)
- [Documentation Reference](#documentation-reference)

---

## Architectural Philosophy

Instead of a bulky multi-tenant database requiring `business_id` partition keys and complex row-level permission overhead, this template uses a **Clean Independent Instance Model**:

```
                       MASTER TEMPLATE (v1.0.0)
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
   CLIENT STORE A            CLIENT STORE B            CHRONYX ATELIER
 (Own Repo + Vercel)       (Own Repo + Vercel)       (Own Repo + Vercel)
         │                         │                         │
         ▼                         ▼                         ▼
   SUPABASE PROJ A           SUPABASE PROJ B           SUPABASE PROJ
(Isolated PostgreSQL)     (Isolated PostgreSQL)     (Isolated PostgreSQL)
```

- **100% Data Isolation**: Databases, customer orders, auth records, and assets are completely physically segregated.
- **Source Code Independence**: Reusable core components remain pristine; brand identity, styling, locale, currency, and toggles are driven entirely by environment variables and database settings.
- **Upstream Syncing**: Bug fixes and enhancements from the Master Template can be pulled cleanly via standard Git remotes without risking client schema contamination.

---

## Key Features

### Storefront Experience
- **Editorial Design & Typography**: Ultra-refined luxury typography, smooth scrolling via Lenis, and animations with GSAP.
- **Dynamic Catalog & Filtering**: Rich product pages, customizable attribute pills, real-time inventory tracking, and hero frame selection.
- **Interactive Capabilities**:
  - Exit-intent email capture popup.
  - Interactive placement guides and hanging dimension tools.
  - City-specific programmatic location delivery pages.
  - Serialized physical unit QR code verification (`product_auth_units`).
  - Customer review submission & star ratings.
  - Promo code discounts with atomic coupon redemption.
- **Checkout & Fulfillment**:
  - Multi-step checkout with instant address validation.
  - Native cash-on-delivery (COD) calculations and online payments via Razorpay.
  - Client-side dynamic GST/commercial PDF invoice generator (`@react-pdf/renderer`).

### Dedicated Admin Panel (`admin-panel/`)
- **Operations-First Order Management**: Status tracking, fulfillments, customer summaries, and one-click PDF generation (Invoices, Packing Slips, Authenticity Certificates, and QR Label Sheets).
- **Catalog Management**: Dynamic product attribute builder, Cloudinary image uploader, limited-edition drop scheduler, and stock management.
- **Content & CMS Suite**:
  - **Pages & Content**: Real-time editor for hero banners, brand story, FAQs, testimonials, and legal policies.
  - **Navigation Manager**: Drag-and-drop link organization for header and footer.
  - **Journal Manager**: Editorial article authoring with Markdown preview, SEO slugs, and publication dates.
  - **Marketing Center**: Coupon code creation, usage quotas, subscriber export, and email blast simulations.
  - **SEO Manager**: Route-by-route meta tags, social sharing cards (OpenGraph), and structured data overrides.
  - **Settings**: Storewide toggles (maintenance mode, free shipping thresholds, COD fees, payment gateways).

---

## Repository Structure

```
.
├── admin-panel/                 # Independent Admin Panel Vite SPA
│   ├── src/
│   │   ├── components/common/   # Reusable UI component library (Modals, Badges, Tables, Forms)
│   │   ├── components/pdf/      # Admin PDF documents (Packing slips, Certificates, QR sheets)
│   │   ├── config/              # Admin configs & template version manifests
│   │   ├── pages/               # Operational screens (Orders, Products, Content, Navigation, etc.)
│   │   └── lib/                 # Supabase client & identity helpers
│   ├── index.html
│   └── package.json
├── src/                         # Public Storefront Vite Application
│   ├── components/              # Navigation, Cart, Header, Footer, Video Player, Schemas
│   ├── components/pdf/          # Customer-facing Invoice PDF generator
│   ├── config/                  # siteConfig, featureConfig, themeConfig, templateVersion
│   ├── data/                    # Local storage cart/wishlist stores & currency formatters
│   ├── lib/                     # Payment provider boundary, Supabase client, journal helpers
│   ├── pages/                   # Storefront routes (Home, Shop, Product, Checkout, Verify, etc.)
│   └── styles.css               # Core CSS & Design Token system
├── scripts/                     # Automation, validation & provisioning tools
│   ├── bootstrap-admin.mjs      # First-admin account provisioning CLI
│   ├── preflight.mjs            # Production deployment preflight test runner
│   ├── provision-client.mjs     # Interactive & headless client generator CLI
│   ├── provision-storage.mjs    # Cloudinary & media preset auditor
│   ├── provision-supabase.mjs   # Authoritative SQL migration bundler
│   ├── seed-database.mjs        # Idempotent baseline settings seeder
│   ├── validate-assets.mjs      # Static brand asset validation
│   └── validate-config.mjs      # Configuration, JWT & security secret validator
├── supabase/
│   ├── functions/               # Supabase Edge Functions (Razorpay checkout, Resend transactional emails)
│   └── migrations/              # 17 Authoritative, immutable SQL schema migrations
├── .github/workflows/ci.yml     # Automated PR/Push CI pipeline
├── CLIENT_DEPLOYMENT_BLUEPRINT.md # Step-by-step 20-stage deployment runbook
├── MASTER_TEMPLATE_OPERATIONS.md  # Detailed operational, security & recovery manual
└── package.json
```

---

## Quick Start & Local Development

### 1. Prerequisites
- **Node.js**: `v20.x` or later
- **npm**: `v10.x` or later

### 2. Installation
Install dependencies for both the root storefront and the admin panel:

```bash
# Install root dependencies
npm install

# Install admin panel dependencies
npm --prefix admin-panel install
```

### 3. Environment Setup
Copy the sample environment templates:

```bash
# Storefront configuration
cp .env.example .env

# Admin Panel configuration
cp admin-panel/.env.example admin-panel/.env
```

Fill in your Supabase project credentials in both `.env` and `admin-panel/.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 4. Run Development Servers

```bash
# Terminal 1 — Launch Storefront (http://localhost:5173)
npm run dev

# Terminal 2 — Launch Admin Panel (http://localhost:5174)
npm --prefix admin-panel run dev
```

---

## Client Provisioning CLI

To onboard a brand-new client store, use the built-in provisioning engine:

```bash
# Interactive mode (prompts for brand name, currency, locale, capabilities, etc.)
npm run provision-client
```

Or run headless via command-line flags:

```bash
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

This generates `.env.client` and `admin-panel/.env.client` with full validation checks and zero manual source code edits.

---

## Database & Migrations

The database schema is defined across **17 sequential, authoritative SQL migrations** in `supabase/migrations/`:

| # | Migration File | Description |
|---|---|---|
| `000` | `000_base_products.sql` | Core `products` & `product_images` catalog tables |
| `001` | `001_initial_schema.sql` | Settings, orders, subscribers, coupons, waitlist, contact messages |
| `002` | `002_orders_patch.sql` | Order schema column expansion |
| `003` | `003_product_extra_fields.sql` | Product attributes, materials, and specification fields |
| `004` | `004_product_video_fields.sql` | Rich video embed & transcript metadata |
| `005` | `005_admin_users.sql` | `admin_users` table & `public.is_admin()` security function |
| `006` | `006_authenticity_units.sql` | Serial unit verification registry & lookup RPC |
| `007` | `007_blog_posts.sql` | Journal and editorial publication system |
| `008` | `008_collections.sql` | Categorized collections and product relationship mapping |
| `009` | `009_seo_overrides.sql` | Path-based dynamic meta tags and OG images |
| `010` | `010_product_reviews.sql` | Customer reviews, ratings, and approval state |
| `011` | `011_product_reviews_unique_constraint.sql` | Deduplication index for customer reviews |
| `012` | `012_hardened_rls.sql` | Strict Row-Level Security policies across all 10 core tables |
| `013` | `013_stock_decrement_rpc.sql` | Atomic inventory reservation RPC (`decrement_stock`) |
| `014` | `014_stock_increment_rpc.sql` | Atomic inventory restocking RPC (`increment_stock`) |
| `015` | `015_resend_webhook.sql` | Order confirmation transactional email triggers |
| `016` | `016_product_attributes.sql` | Unified flexible JSONB product attributes column |

### Applying to a Fresh Database

```bash
# Option A: Supabase CLI
supabase db push

# Option B: Generate SQL bundle for Supabase Studio SQL Editor
npm run provision-supabase -- --bundle > migrations_bundle.sql
```

### Seeding Required Baseline Records
Seed initial store identity, navigation menus, and policy pages idempotently:

```bash
npm run seed-database -- \
  --store-name "Acme Home" \
  --domain "acmehome.example" \
  --email "hello@acmehome.example"
```

---

## First-Admin Account Bootstrap

The Admin Panel enforces authorization through PostgreSQL Row-Level Security via the `public.is_admin()` function, which verifies that the authenticated user's email exists in `public.admin_users`.

To bootstrap the store owner safely:

```bash
# Automated (requires server-side SUPABASE_SERVICE_ROLE_KEY)
npm run bootstrap-admin -- --email "owner@brand.com"
```

**Manual Dashboard Procedure (No Service Key Required):**
1. In **Supabase Dashboard** > **Authentication** > **Users** > Click **Add User** (e.g. `owner@brand.com`).
2. In **SQL Editor**, run:
   ```sql
   INSERT INTO public.admin_users (email) VALUES ('owner@brand.com') ON CONFLICT DO NOTHING;
   ```
3. In `admin-panel/.env`, set:
   ```env
   VITE_ADMIN_EMAIL=owner@brand.com
   ```
4. Sign in at `http://localhost:5174`.

---

## Capabilities System

Toggle features dynamically via `.env` flags without deleting code. Capabilities are centralized in [`src/config/featureConfig.js`](src/config/featureConfig.js):

| Capability Key | Flag Variable | Default | Description |
|---|---|:---:|---|
| `cart` | Core | `true` | Slide-out cart drawer and local cart state |
| `checkout` | Core | `true` | Multi-step checkout with delivery calculations |
| `reviews` | `VITE_FEATURE_REVIEWS` | `true` | Star ratings and customer review submissions |
| `coupons` | `VITE_FEATURE_COUPONS` | `true` | Promo code input with real-time discount deduction |
| `wishlist` | `VITE_FEATURE_WISHLIST` | `true` | Client-side wishlist favorites storage |
| `journal` | `VITE_FEATURE_JOURNAL` | `true` | Editorial blog articles and story pages |
| `productVerification` | `VITE_FEATURE_PRODUCT_VERIFICATION` | `false` | Serial number QR certificate verification |
| `placementGuide` | `VITE_FEATURE_PLACEMENT_GUIDE` | `false` | Interactive room sizing & placement guide |
| `locationPages` | `VITE_FEATURE_LOCATION_PAGES` | `false` | Programmatic local landing pages |
| `exitIntentPopup` | `VITE_FEATURE_EXIT_INTENT` | `true` | Newsletter modal triggered on mouse-exit |
| `whatsappWidget` | `VITE_FEATURE_WHATSAPP_WIDGET` | `true` | Floating WhatsApp concierge support button |

---

## Themes & Customization

The template includes built-in design token presets in [`src/config/themeConfig.js`](src/config/themeConfig.js):

- **`chronyx`**: Luxury dark aesthetic with warm bronze and gold metallic accents (default).
- **`minimal`**: Crisp, high-contrast monochrome typography with clean white surfaces.
- **`warmEditorial`**: Warm cream background, serif headings, and organic earth tones.

Set the theme in `.env`:
```env
VITE_THEME=minimal
```

---

## Payment Gateways & Currency

The architecture enforces a clean separation between **Payment Methods** (what the user selects) and **Payment Providers** (the processing engine) via [`src/lib/paymentProviders.js`](src/lib/paymentProviders.js):

- **Supported Currencies**: Any ISO-4217 currency (`USD`, `EUR`, `GBP`, `INR`, `CAD`, `AUD`, etc.). Formatted natively with `Intl.NumberFormat`.
- **Payment Providers**:
  - `offline`: Cash on Delivery (COD) / Bank Transfer (Available in all currencies).
  - `razorpay`: Built-in for INR and International Merchant accounts.
  - `stripe_future`: Extensible provider boundary for Stripe Elements.

---

## Preflight, Testing & CI/CD

Before deploying to production, run the end-to-end preflight verification suite:

```bash
# Run Vitest unit tests
npm test

# Run full configuration, asset, theme, and payment preflight audit
npm run preflight

# Build both applications for production
npm run build
npm --prefix admin-panel run build
```

### GitHub Actions CI
Every commit and pull request to `main` executes [`.github/workflows/ci.yml`](.github/workflows/ci.yml) to ensure zero regressions before production releases.

---

## Deployment Runbook

Deploy each client independently using Vercel:

1. **Storefront Project**:
   - **Root Directory**: `./`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**: Add public variables from `.env`.
2. **Admin Panel Project**:
   - **Root Directory**: `admin-panel`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Domain**: Connect `admin.clientdomain.com`.
   - **Environment Variables**: Add variables from `admin-panel/.env`.

---

## Documentation Reference

- **[CLIENT_DEPLOYMENT_BLUEPRINT.md](CLIENT_DEPLOYMENT_BLUEPRINT.md)**: Comprehensive 20-stage deployment manual covering DNS, Vercel, Resend email routing, and post-launch checklists.
- **[MASTER_TEMPLATE_OPERATIONS.md](MASTER_TEMPLATE_OPERATIONS.md)**: Operational runbook detailing database rollbacks, disaster recovery, secret management, and template upgrade workflows.

---

## License

Private and proprietary. Developed for independent single-tenant commercial client deployments.
