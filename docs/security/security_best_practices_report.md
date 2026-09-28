# CHRONYX Test and Security Report

Generated on 2026-05-05.

## Executive Summary

The storefront and admin panel both produce production builds. I added a Vitest test harness to the storefront and covered the reusable integrity logic for cart parsing, currency formatting, structured data, video sitemap XML escaping, and authenticity URL/code generation.

The main dependency audit is now clean after upgrading the storefront Vite toolchain. The admin dependency audit is also clean. The biggest remaining risks are authorization and payment integrity: several Supabase RLS policies grant broad privileges to any authenticated user, and the Razorpay success callback records paid orders without visible server-side payment signature verification in this repo.

## Tests Run

| Area | Command | Result | Notes |
| --- | --- | --- | --- |
| Storefront unit tests | `npm test` | Passed | 3 files, 12 tests |
| Storefront browser smoke tests | `npm run test:e2e` | Passed | 5 Playwright workflow tests |
| Storefront local security audit | `npm run security:audit` | Failed as expected | 11 open security findings detected |
| Storefront production build | `npm run build` | Passed | Build works on Vite 8.0.10 |
| Storefront dependency audit | `npm audit --audit-level=moderate` | Passed | 0 vulnerabilities after Vite upgrade |
| Admin production build | `npm run build` in `admin-panel` | Passed | Build works on Vite 8.0.10 |
| Admin dependency audit | `npm audit --audit-level=moderate` in `admin-panel` | Passed | 0 vulnerabilities |
| Admin lint | `npm run lint` in `admin-panel` | Failed | 33 errors, mostly unused `React` imports and React hook immutability/function-order findings |

## Automated Tests Added

Files added:

- `src/__tests__/store.test.js`
- `src/__tests__/productIdentity.test.js`
- `src/__tests__/structuredData.test.js`
- `scripts/security-audit.mjs`
- `playwright.config.js`
- `tests/e2e/storefront.spec.js`

Coverage added:

- Cart localStorage parsing rejects malformed and non-array values.
- Currency formatting stays INR/no-paise.
- Product public IDs sanitize noisy input.
- Authenticity unit creation is deterministic under stubbed crypto.
- Verification links encode authenticity codes safely.
- Absolute URLs, HTML stripping, video duration conversion, YouTube/Vimeo embed normalization, product schema generation, video asset generation, and sitemap XML escaping are covered.
- Security audit checks now detect the open report findings from the command line.
- Browser smoke tests cover home render, shop/product browsing, cart route access, unauthenticated checkout redirect, and invalid authenticity verification.

## Current Executable Status

Green:

- `npm test`
- `npm run test:e2e`
- `npm run build`
- `npm audit --audit-level=moderate`
- `npm run build` in `admin-panel`
- `npm run lint` in `admin-panel`
- `npm audit --audit-level=moderate` in `admin-panel`
- `npm run security:audit` / `node scripts/security-audit.mjs`
- `.env.local` has been removed from Git tracking and is now covered by `.gitignore`

Red:

- None in local automated checks.

Live credentials required:

- Supabase RLS tests with anonymous, customer, and admin users.
- Razorpay test-mode payment verification tests.
- Edge function invocation tests against deployed Supabase functions.
- Runtime production-header checks against the deployed domain/CDN.

## Recommended Full Test List

### Unit Tests

- Cart add/remove/update quantity and line totals.
- Checkout subtotal, shipping fee, COD fee, coupon discount, and final total.
- Product identity and authenticity QR helpers.
- SEO/structured data helpers.
- Coupon validation helper once extracted from `PaymentPage.jsx`.
- Order payload creation once extracted from `PaymentPage.jsx`.
- Admin data mappers for orders/products/collections/content.

### Integration Tests

- Supabase product, collection, blog, settings reads.
- Auth sign-in/sign-up and return-to flow.
- Account page reads only current user's orders.
- Review flow only allows delivered orders owned by the user.
- Contact form insert plus `send-contact-email` invocation.
- Marketing email function requires admin authorization before sending.
- Razorpay order creation verifies amount from server-side cart data.
- Order creation verifies payment signature before marking paid.
- Stock decrement/increment RPCs handle concurrent purchases.
- Coupon usage increment handles max-use races.
- Authenticity unit assignment is atomic and cannot double-assign units.

### End-to-End Tests

- Home -> shop -> product -> cart.
- Guest/auth redirect into checkout.
- Authenticated checkout with COD.
- Razorpay test-mode checkout with verified callback.
- Empty cart and failed payment states.
- Account order history.
- Delivered order review submission.
- Product authenticity verification valid, missing, archived, and code-mismatch states.
- Admin login rejects non-admin users.
- Admin products CRUD.
- Admin collections/content/settings CRUD.
- Admin order status transitions and stock restoration.
- Admin contact and marketing workflows.

### Security Tests

- OWASP frontend scan for XSS sinks, unsafe redirects, unsafe third-party scripts, token storage, and missing security headers.
- Supabase RLS policy tests with anonymous, normal authenticated, and admin users.
- Payment tampering tests for client-modified amount, item price, quantity, discount, status, and Razorpay payment id.
- Edge function auth tests.
- Email HTML injection tests.
- Dependency audit on both apps.
- Secret scanning for committed `.env` and service-role keys.
- Runtime header tests for CSP, frame protections, nosniff, referrer policy, and permissions policy.

## Security Findings

### SEC-001: Paid orders can be recorded from an unverified browser callback

Status: Fixed in local code. The browser now creates a Razorpay order through `supabase/functions/create-razorpay-order`, then sends Razorpay's signed callback to `supabase/functions/verify-razorpay-payment`. The server verifies the signature, fetches the Razorpay payment, compares order id/currency/amount against a server-recomputed cart total, then creates the paid order.

Severity: Critical

Location: `src/pages/PaymentPage.jsx:130-155`, `src/pages/PaymentPage.jsx:201-222`

Evidence:

- The browser sends `amount: Math.round(finalTotal * 100)` to `create-razorpay-order`.
- Razorpay `handler` calls `processOrder(response)`.
- `processOrder` writes the order with `status: 'paid'` whenever the selected method is not COD.
- Only `razorpay_payment_id` is stored; no visible server-side `razorpay_order_id` / `razorpay_signature` verification appears in this repo.

Impact:

An attacker can tamper with client-side state or callback handling and create an order marked as paid unless the missing Supabase function performs strict server-side verification and order creation. This can directly affect revenue and fulfillment integrity.

Recommended fix:

Move paid order creation to a server-side Supabase function. The server should compute the amount from trusted product IDs/quantities, create the Razorpay order, verify `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`, then insert the paid order and decrement stock in one controlled flow.

### SEC-002: RLS treats any authenticated user as an admin

Status: Fixed in local SQL. `rls_policies.sql` now creates `public.admin_users`, `public.is_admin()`, admin-only policies for operational tables, and customer-owned order reads.

Severity: High

Location: `rls_policies.sql:27-38`, `rls_policies.sql:72-87`, `rls_policies.sql:122-153`, `authenticity_units_schema.sql:39-45`

Evidence:

- Product, image, order, subscriber, coupon, waitlist, and authenticity-unit policies use `TO authenticated` with `USING (true)` / `WITH CHECK (true)`.
- The admin panel checks `VITE_ADMIN_EMAIL` in the browser, but database authorization does not enforce that same admin boundary.

Impact:

Any signed-in user may be able to read or mutate admin-level data directly through the Supabase API, depending on which SQL patch is applied in production. Browser-only admin checks are not a security boundary.

Recommended fix:

Create a server-enforced admin role, for example an `admin_users` table or JWT custom claim, and change privileged RLS policies to check that role. Customer policies should use ownership checks such as `customer_email = auth.jwt() ->> 'email'`.

### SEC-003: Public authenticity table exposes secret verification codes

Status: Fixed in local SQL and frontend code. `authenticity_units_schema.sql` removes public table reads, adds admin-only policies, and exposes `verify_product_auth_unit(public_unit_id, code)` so the storefront can verify without reading `authenticity_code`.

Severity: High

Location: `authenticity_units_schema.sql:33-37`, `src/pages/VerifyProductPage.jsx`

Evidence:

`product_auth_units` has a public `SELECT` policy with `USING (true)`. The table includes both `public_unit_id` and `authenticity_code`.

Impact:

If the public query can read `authenticity_code`, anyone can enumerate or retrieve valid certificate codes and make counterfeit verification URLs look legitimate.

Recommended fix:

Do not expose `authenticity_code` through public table reads. Use an RPC/function that accepts `{ public_unit_id, code }` and returns only a boolean verification result plus non-secret display fields.

### SEC-004: Marketing email edge function lacks visible admin authorization

Status: Fixed in local edge function code. `send-marketing-email` now requires a valid user JWT, checks `admin_users`, validates CTA URLs, and escapes request-controlled email HTML.

Severity: High

Location: `supabase/functions/send-marketing-email/index.ts:58-110`

Evidence:

The function reads all subscriber/waitlist emails using the service role key and sends arbitrary `subject`, `message`, CTA label, and CTA URL from the request body. The function does not visibly call `supabase.auth.getUser`, check JWT claims, or enforce an admin allowlist before sending.

Impact:

If this edge function is deployed with broad invocation permissions, anyone who can call it can send bulk email to the customer list and can inject HTML into campaign content.

Recommended fix:

Require a valid user JWT, verify admin status server-side, validate the segment and CTA URL, rate-limit the function, and HTML-escape/sanitize all user-controlled email content.

### SEC-005: Journal article HTML is rendered without sanitization

Status: Fixed in local frontend code. Journal content is passed through an allowlist sanitizer before `dangerouslySetInnerHTML`.

Severity: Medium

Location: `src/pages/JournalArticlePage.jsx:136-138`

Evidence:

`article.content` from Supabase is rendered with `dangerouslySetInnerHTML`.

Impact:

If a non-admin user can write blog content, or if admin credentials/content pipeline are compromised, stored XSS can execute in visitors' browsers.

Recommended fix:

Sanitize article HTML before rendering with a proven sanitizer such as DOMPurify, and restrict allowed tags/attributes to the editorial subset actually needed.

### SEC-006: Production security headers are not configured in Vercel config

Status: Fixed in local Vercel config. `vercel.json` now includes CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `X-Frame-Options`.

Severity: Medium

Location: `vercel.json:8-18`

Evidence:

Only long-lived asset caching headers are configured. CSP, `X-Content-Type-Options`, clickjacking protection, referrer policy, and permissions policy are not visible in this repo.

Impact:

The app has weaker browser-level defense in depth against XSS, clickjacking, MIME confusion, and unnecessary browser feature exposure.

Recommended fix:

Add security headers in Vercel or the CDN/edge layer. At minimum, configure a tested CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `Permissions-Policy`. Use `frame-ancestors` in CSP rather than relying only on legacy `X-Frame-Options`.

## Non-Security Quality Findings

### QA-001: Admin lint is currently failing

Status: Fixed locally. Admin lint now passes with no errors or warnings.

Severity: Medium

Location: `admin-panel`

Evidence:

`npm run lint` reports 33 errors. The largest groups are unused `React` imports and React hook immutability/function-order findings where effects reference `const` functions declared later in the component.

Impact:

Lint failures reduce CI confidence and can hide future real regressions.

Recommended fix:

Remove unused `React` imports where the automatic JSX runtime is used. Convert fetch handlers used by effects into stable `useCallback` functions declared before the effects, or into function declarations if they do not capture changing state.

### QA-002: Storefront bundle is large

Severity: Low

Location: `npm run build`

Evidence:

The storefront JS bundle is about 2.1 MB minified / 681 KB gzip, and Vite warns about chunks larger than 500 KB.

Impact:

Initial load performance can suffer, especially on mobile connections.

Recommended fix:

Code-split heavy routes/components such as PDF rendering, product media, account/admin-like flows, and third-party player libraries.

## Next Hardening Steps

1. Fix server-side authorization first: Supabase RLS admin role checks, customer ownership checks, and private authenticity-code verification.
2. Move payment finalization fully server-side with Razorpay signature verification.
3. Lock down marketing email invocation and sanitize campaign HTML.
4. Add Playwright E2E tests for storefront and admin workflows.
5. Add Supabase integration tests with anon, customer, and admin test users.
6. Fix admin lint so CI can block regressions.
