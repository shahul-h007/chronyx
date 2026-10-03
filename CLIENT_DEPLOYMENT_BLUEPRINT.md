# Client Deployment Blueprint
## Master E-commerce Template — Independent Deployment Guide

This blueprint details the complete, step-by-step process for provisioning, configuring, and deploying a brand-new, independent e-commerce storefront and admin panel for a new client using this Master E-commerce Template.

---

## 1. Architectural Philosophy

This template does **NOT** use a multi-tenant SaaS architecture. There is no `business_id` column, no shared database, and no unified super-admin dashboard.

```
                      MASTER TEMPLATE REPOSITORY
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
   CLIENT STORE A          CLIENT STORE B          CLIENT STORE C
  (Separate GitHub)       (Separate GitHub)       (Separate GitHub)
          │                       │                       │
          ▼                       ▼                       ▼
   SUPABASE PROJ A         SUPABASE PROJ B         SUPABASE PROJ C
   (Isolated DB/RLS)       (Isolated DB/RLS)       (Isolated DB/RLS)
          │                       │                       │
          ▼                       ▼                       ▼
   VERCEL PROJECT A        VERCEL PROJECT B        VERCEL PROJECT C
  (clientA.com/admin)     (clientB.com/admin)     (clientC.com/admin)
```

Each client store enjoys:
- **100% Data Isolation**: Own database schema, auth users, RLS policies, and file storage buckets.
- **Independent CI/CD**: Deployments to client-specific domains on Vercel without impacting other stores.
- **Customizable Identity & Capabilities**: Configured via environment variables, `siteConfig.js`, `themeConfig.js`, and database `store_settings`.

---

## 2. Prerequisites

Before setting up a new client store, obtain:
1. **GitHub Account**: Organization or personal account to host the client repository.
2. **Supabase Account**: A new Supabase project (Free or Pro tier).
3. **Vercel Account**: For deploying the storefront and admin panel.
4. **Custom Domain**: DNS control for the client's production domain (e.g., `brand.com`).
5. **Payment Gateway**: Active Razorpay Key ID and Key Secret (or alternative configured provider).
6. **Transactional Email Service**: Resend API key for order confirmations and contact emails.

---

## 3. Step-by-Step 20-Stage Deployment Guide

### Stage 1: Repository Provisioning
1. Create a new private repository on GitHub (e.g., `client-brand-store`).
2. Clone or duplicate the master template repository:
   ```bash
   git clone https://github.com/chronyxbrand/chronyx.git client-brand-store
   cd client-brand-store
   git remote set-url origin git@github.com:client-org/client-brand-store.git
   git push -u origin main
   ```

### Stage 2: Supabase Project Setup
3. Navigate to [Supabase](https://supabase.com) and create a new project:
   - Name: `Client Brand E-commerce`
   - Database Password: Save securely in password vault.
   - Region: Select closest to client's primary market (e.g., Mumbai `ap-south-1` for India).

### Stage 3: Database Schema & Migration Execution
4. Run the database migration files located in `supabase/migrations/` sequentially via the Supabase SQL Editor or Supabase CLI:
   - Core tables: `products`, `categories`, `collections`, `orders`, `order_items`, `customers`, `settings`, `blog_posts`, `coupons`, `reviews`.
   - Optional tables (if capabilities enabled): `product_auth_units` (Authenticity Registry), `contact_messages`.
   - Execute all RLS security policies and RPC functions (`decrement_stock`, `increment_coupon_usage`, `verify_product_auth_unit`).

### Stage 4: Storage Bucket Configuration
5. In the Supabase Dashboard > Storage, create public buckets:
   - `product-images`: Public read access for product photography.
   - `blog-images`: Public read access for journal hero and editorial images.
   - `documents`: Optional secure bucket for generated PDF archives.
   - Set up permissive RLS for authenticated admin uploads.

### Stage 5: Supabase Edge Functions Deployment
6. Deploy edge functions from `supabase/functions/`:
   ```bash
   supabase functions deploy create-razorpay-order
   supabase functions deploy verify-razorpay-payment
   supabase functions deploy send-contact-email
   supabase functions deploy send-order-email
   ```
7. Configure Edge Function Secrets:
   ```bash
   supabase secrets set RAZORPAY_KEY_ID="rzp_live_..."
   supabase secrets set RAZORPAY_KEY_SECRET="..."
   supabase secrets set RESEND_API_KEY="re_..."
   ```

### Stage 6: Storefront Environment Variables
8. Copy `.env.example` to `.env` in the root repository:
   ```env
   # Core Supabase
   VITE_SUPABASE_URL=https://<client-id>.supabase.co
   VITE_SUPABASE_ANON_KEY=<client-anon-key>

   # Site Identity & Canonical
   VITE_STORE_NAME="Client Brand"
   VITE_SITE_URL=https://www.clientbrand.com
   VITE_STORE_TAGLINE="Fine Contemporary Objects"
   VITE_CONTACT_EMAIL=concierge@clientbrand.com

   # Localization & Theme
   VITE_CURRENCY_CODE=USD
   VITE_CURRENCY_SYMBOL=$
   VITE_LOCALE=en-US
   VITE_THEME=minimal

   # Payment Gateway
   VITE_RAZORPAY_KEY_ID=rzp_live_...

   # Capability Flags (Optional Overrides)
   VITE_FEATURE_REVIEWS=true
   VITE_FEATURE_WISHLIST=true
   VITE_FEATURE_JOURNAL=true
   VITE_FEATURE_PRODUCT_VERIFICATION=false
   VITE_FEATURE_PLACEMENT_GUIDE=false
   VITE_FEATURE_LOCATION_PAGES=false
   ```

### Stage 7: Admin Panel Environment Variables
9. Configure `admin-panel/.env`:
   ```env
   VITE_SUPABASE_URL=https://<client-id>.supabase.co
   VITE_SUPABASE_ANON_KEY=<client-anon-key>
   VITE_STORE_NAME="Client Brand"
   VITE_STORE_TAGLINE="Fine Contemporary Objects"
   VITE_STOREFRONT_URL=https://www.clientbrand.com
   VITE_CONTACT_EMAIL=concierge@clientbrand.com
   VITE_CURRENCY_CODE=USD
   VITE_CURRENCY_SYMBOL=$
   VITE_LOCALE=en-US
   ```

### Stage 8: Brand & Static Configuration Setup
10. Update `src/config/siteConfig.js` to match the client's business details:
    - Name, domain, legal company name, support emails, address, and social links.
    - Localization: `currencyCode`, `currencySymbol`, `locale` (e.g., `USD`, `$`, `en-US` or `INR`, `₹`, `en-IN`).
    - Storage keys: Update `cartKey`, `wishlistKey`, and `orderKey` with client prefix (e.g., `client-cart`).

### Stage 9: Visual Theme & Aesthetic Preset Selection
11. In `src/config/themeConfig.js`, select or customize the theme preset:
    - `chronyx`: Warm obsidian, gold accent, Cormorant Garamond serif headings.
    - `minimal`: High-contrast monochrome, geometric sans-serif (Inter / Plus Jakarta Sans).
    - `warmEditorial`: Cream surface, espresso typography, terracotta accents.
12. Or define custom CSS variables in `src/styles.css` under `:root`.

### Stage 10: Capability Profile Selection
13. In `src/config/featureConfig.js`, review active features:
    - Turn OFF niche features if not required by client:
      - `productVerification: false` (hides Authenticity Registry, serial numbers, QR verification).
      - `placementGuide: false` (hides wall clock hanging guide).
      - `locationPages: false` (disables city-specific SEO landing pages).
    - Turn ON relevant core features: `reviews: true`, `wishlist: true`, `journal: true`, `coupons: true`.

### Stage 11: Document & PDF Template Configuration
14. Verify document settings:
    - Invoices and packing slips will automatically pull brand name, address, support email, and currency from `siteConfig.js` and `adminConfig.js`.
    - Provide custom high-resolution logos in `public/brand-logo.png` if required.

### Stage 12: Admin User Creation
15. In Supabase Dashboard > Authentication > Users, create the client's admin user account.
16. In the SQL Editor, grant admin access or confirm the email is authorized in `admin-panel/src/pages/Login.jsx`.

### Stage 13: Catalog & Initial Inventory Seeding
17. Log in to the Admin Panel locally (`cd admin-panel && npm run dev`):
    - Create categories in **Products > Categories** or Collections.
    - Create the initial product catalog with photos, descriptions, stock quantities, and prices.
    - In **Store Settings**, configure free shipping threshold, COD availability, and maintenance mode.

### Stage 14: Navigation & Footer Setup
18. In Admin Panel > **Navigation Manager**:
    - Configure Header items (e.g., Shop, Collections, About, Contact).
    - Configure Footer links (Customer Care, Policies, Socials).
    - Publish navigation structure to Supabase.

### Stage 15: Content & Editorial Setup
19. In Admin Panel > **Pages & Content**:
    - Customize Homepage hero headlines, banners, and testimonial quotes.
    - Update About page history, atelier story, and values.
    - Review and update Policy pages (Privacy, Terms of Service, Shipping & Returns).

### Stage 16: Local End-to-End Verification & Preflight
20. Run the template hardening and validation test suites locally:
    ```bash
    npm run validate-config     # Validates environment and capability integrity
    npm run validate-assets     # Validates branding and core template assets
    npm run preflight           # Runs full pre-deployment preflight suite
    npm test                    # Runs Vitest unit tests
    npm run build               # Storefront production build
    npm --prefix admin-panel run build # Admin panel production build
    ```
    Ensure 100% clean exit codes and verify sitemap generation.

### Stage 17: Vercel Project Setup (Storefront)
21. Connect GitHub repository to Vercel:
    - Root Directory: `./`
    - Framework Preset: Vite
    - Build Command: `npm run build`
    - Output Directory: `dist`
    - Inject environment variables from Stage 6.

### Stage 18: Vercel Project Setup (Admin Panel)
22. Create a second Vercel project or configure monorepo routing for admin:
    - Option A (Separate Vercel Project, recommended):
      - Root Directory: `admin-panel`
      - Framework Preset: Vite
      - Build Command: `npm run build`
      - Output Directory: `dist`
      - Domain: `admin.clientbrand.com`
      - Inject environment variables from Stage 7.
    - Option B (Subdirectory via `vercel.json` rewrites).

### Stage 19: Custom Domain & DNS Configuration
23. In domain registrar (e.g., Cloudflare, Namecheap, GoDaddy):
    - Add `A` or `CNAME` records pointing `www.clientbrand.com` to Vercel.
    - Add `CNAME` pointing `admin.clientbrand.com` to Vercel.
    - Add SPF, DKIM, and DMARC records for Resend transactional email deliverability.

### Stage 20: Post-Launch Operational Checklist
24. Perform live smoke testing:
    - [ ] Complete a test transaction via Razorpay Test/Live mode.
    - [ ] Verify order appears in Admin Panel Orders list.
    - [ ] Verify GST invoice downloads with client branding and correct currency.
    - [ ] Confirm contact form submits to database and triggers transactional email.
    - [ ] Verify SEO tags and OpenGraph cards via social debuggers.
    - [ ] Check Google Search Console verification tag in `SEOManager`.

---

## 4. Capability Reference Matrix

| Capability Key | Default | Category | DB Table / Dependency | Description |
| :--- | :--- | :--- | :--- | :--- |
| `cart` | `true` | Core | LocalStorage (`cartKey`) | Shopping cart drawer and checkout flow. |
| `checkout` | `true` | Core | `orders`, `order_items` | Multi-step checkout with address and payment. |
| `coupons` | `true` | Optional | `coupons`, RPC | Promo code application and discount logic. |
| `reviews` | `true` | Optional | `reviews` | Customer ratings, star display, verified reviews. |
| `wishlist` | `true` | Optional | LocalStorage (`wishlistKey`) | Save items to wishlist without requiring account. |
| `journal` | `true` | Optional | `blog_posts`, `store_settings.show_journal` | Editorial articles, stories, rich content. |
| `productVerification` | `false` | Optional | `product_auth_units`, RPC | Serialized physical units, QR code authenticity checks. |
| `placementGuide` | `false` | Optional | Static route `/guides/wall-clock-placement` | Room placement and hanging height guide. |
| `locationPages` | `false` | Optional | Static route `/locations/:city` | Programmatic local landing pages for delivery. |
| `exitIntentPopup` | `true` | Optional | LocalStorage | Exit-intent newsletter signup modal. |
| `whatsappWidget` | `true` | Optional | `store_settings.whatsapp_number` | Floating quick-chat WhatsApp support button. |

To toggle any capability, set `VITE_FEATURE_<KEY>=false` in `.env` or edit `src/config/featureConfig.js`.

---

## 5. Maintenance & Ongoing Operations

- **Backups**: Set up automated daily database backups in Supabase project settings.
- **Updates**: Because each client store is an independent Git clone, template improvements from the upstream Master Template can be pulled via `git fetch upstream && git merge upstream/main` without affecting custom database data.
- **Logs & Monitoring**: Monitor Edge Function logs in Supabase Dashboard and web traffic via Vercel Analytics.

---

## 6. Payment Provider Boundary & Currency Mapping

The Master Template strictly separates:
1. **Payment Methods** (User checkout selection: COD, UPI, Card, NetBanking).
2. **Payment Providers** (Gateway fulfillment engine: `offline`, `razorpay`, or future `stripe`).

### Currency Compatibility
- **Display Currency vs Gateway Support**: Setting a display currency (e.g. `VITE_CURRENCY_CODE=USD`) does **not** automatically mean the payment gateway will process the transaction without merchant configuration.
- **Razorpay**: Native to `INR`. Non-INR currencies (USD, EUR, GBP) require activating *International Payments* in the client's Razorpay Merchant Dashboard.
- **Offline / Cash On Delivery**: Operates independently of gateways and supports any local currency.

---

## 7. Master Template Versioning

- **Version Manifest**: [`src/config/templateVersion.js`](src/config/templateVersion.js) exports `TEMPLATE_VERSION` and `TEMPLATE_MANIFEST`.
- **Current Version**: `1.0.0` (*Foundation Hardened*).
- **Client Independence**: Each client repository maintains its own git history and configuration without being automatically impacted by upstream template updates. Upstream improvements are merged voluntarily via standard Git workflows.

