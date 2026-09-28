# CHRONYX Admin CMS Blueprint

## Goal

Turn the current admin panel into a true owner-controlled CMS so the CHRONYX storefront can be updated without relying on developers for routine content, merchandising, and merchandising-adjacent site changes.

This blueprint is based on the current code in:

- `D:\project\chronyx\admin-panel`
- `D:\project\chronyx\src`

It separates:

- what already exists
- what is missing
- what should be added
- what order we should build it in

---

## 1. Current State

## 1.1 What the admin already manages

### Products

Current screens:

- `D:\project\chronyx\admin-panel\src\pages\Products.jsx`
- `D:\project\chronyx\admin-panel\src\pages\ProductForm.jsx`

Current editable fields:

- product name
- tagline
- summary
- story / long description
- category
- tags
- price
- stock quantity
- live / draft state
- limited drop toggle
- drop date
- size
- finish
- material
- movement type
- features
- care instructions
- product images

### Orders

Current screen:

- `D:\project\chronyx\admin-panel\src\pages\Orders.jsx`

Current capabilities:

- view orders
- filter by status
- search orders
- update order status
- export CSV
- print packing slip
- adjust stock when cancelling / uncancelling

### Content

Current screen:

- `D:\project\chronyx\admin-panel\src\pages\Content.jsx`

Current editable content:

- homepage hero headline
- homepage hero subtext
- privacy policy
- terms and conditions
- shipping and returns policy

### Marketing

Current screen:

- `D:\project\chronyx\admin-panel\src\pages\Marketing.jsx`

Current capabilities:

- view coupons
- view waitlist entries
- view newsletter entries

Current limitations:

- coupon creation is placeholder-only
- email blast is placeholder-only

### Settings

Current screen:

- `D:\project\chronyx\admin-panel\src\pages\Settings.jsx`

Current editable settings:

- store name
- maintenance mode
- free shipping threshold
- express shipping enabled
- express shipping fee
- COD enabled
- COD fee
- UPI enabled
- card enabled
- netbanking enabled

---

## 1.2 What the storefront already reads from the database

### Products

Current storefront source:

- `D:\project\chronyx\src\App.jsx`

The storefront already reads:

- products
- product images
- name
- tagline
- category
- price
- stock quantity
- size
- finish
- material
- movement type
- care instructions
- tags
- drop date
- summary
- story
- features

This means product editing is the strongest working part of the current admin/store relationship.

---

## 1.3 What is still hardcoded in the storefront

These areas are still coded directly in React and are not truly admin-managed yet.

### Homepage

File:

- `D:\project\chronyx\src\pages\HomePage.jsx`

Hardcoded items:

- hero copy
- press mentions
- testimonials
- social gallery images
- trust strip content
- section headings and summaries

### About page

File:

- `D:\project\chronyx\src\pages\AboutPage.jsx`

Hardcoded items:

- page intro
- materials text
- engineering text
- limited production text
- behind the scenes cards

### Blog / Journal page

File:

- `D:\project\chronyx\src\pages\BlogPage.jsx`

Hardcoded items:

- article list
- article titles
- article excerpts
- article dates

### Contact page

File:

- `D:\project\chronyx\src\pages\ContactPage.jsx`

Hardcoded items:

- support messaging
- support email
- studio address
- response-time copy

### Policies page

File:

- `D:\project\chronyx\src\pages\PoliciesPage.jsx`

Hardcoded items:

- privacy text
- terms text
- refund text
- shipping text

Even though policies exist in admin, the storefront page is not fully wired to consume them.

### Footer

File:

- `D:\project\chronyx\src\components\SiteFooter.jsx`

Hardcoded items:

- footer brand copy
- footer link groups
- newsletter heading and supporting copy

### Tracking

File:

- `D:\project\chronyx\src\pages\TrackingPage.jsx`

Hardcoded / simulated items:

- timeline states
- status messages
- delivery timeline logic

### Reviews

File:

- `D:\project\chronyx\src\pages\ProductPage.jsx`

Hardcoded items:

- review entries
- review summary
- rating display

---

## 2. Core Problem

The current admin is partly a product manager and partly a lightweight CMS.

The current storefront is partly data-driven and partly hardcoded.

That mismatch causes the dependency on developers:

- the admin can save some content
- but the storefront often ignores it
- many important website sections have no editable backend model

The solution is not just “add more fields.”

The solution is:

1. make every important storefront section map to an admin-owned content model
2. make the storefront render from those models
3. organize the admin so those models are understandable and maintainable

---

## 3. Target Admin Architecture

Recommended final admin navigation:

1. Dashboard
2. Catalog
3. Orders
4. Customers
5. Content
6. Journal
7. Marketing
8. Settings

### 3.1 Dashboard

Purpose:

- fast business overview
- operational alerts
- publishing overview

Suggested blocks:

- revenue
- orders
- low stock
- waitlist growth
- coupon performance
- latest orders
- unpublished content alerts
- homepage content status

### 3.2 Catalog

Subsections:

- Products
- Collections
- Categories
- Reviews
- Media

Why:

- products should not also carry all merchandising structure
- collections need separate curation
- categories need separate control
- reviews need moderation
- media needs reuse, not just per-product upload

### 3.3 Orders

Subsections:

- all orders
- order detail
- fulfilment
- invoices / slips
- returns / cancellations

### 3.4 Customers

Subsections:

- customers
- contact messages
- newsletter subscribers
- waitlist entries

### 3.5 Content

Subsections:

- Homepage
- About
- Contact
- Policies
- Footer
- Navigation
- Announcement bar
- Testimonials
- Press mentions
- Social gallery
- FAQs

This is the most important section for reducing developer dependency.

### 3.6 Journal

Subsections:

- articles
- categories
- SEO
- featured post

### 3.7 Marketing

Subsections:

- coupons
- campaigns
- waitlist drops
- newsletter sends
- product launches

### 3.8 Settings

Subsections:

- store settings
- payment settings
- shipping settings
- brand settings
- SEO defaults
- integrations
- team / access

---

## 4. Recommended Data Model

Use a mix of:

- dedicated tables for repeatable items
- `settings` / JSON blocks for singleton page content

This is the cleanest tradeoff for the current codebase.

## 4.1 Keep and continue using

- `products`
- `product_images`
- `orders`
- `order_items`
- `settings`
- `coupons`
- `waitlist`

## 4.2 Add new tables

### `collections`

Purpose:

- curated storefront groupings

Fields:

- `id`
- `name`
- `slug`
- `headline`
- `description`
- `is_featured`
- `sort_order`
- `is_live`
- `seo_title`
- `seo_description`

### `collection_products`

Purpose:

- assign products to collections in order

Fields:

- `id`
- `collection_id`
- `product_id`
- `sort_order`

### `testimonials`

Purpose:

- homepage and product-page social proof

Fields:

- `id`
- `author_name`
- `author_location`
- `quote`
- `rating`
- `is_featured`
- `sort_order`
- `page_target`

### `press_mentions`

Purpose:

- homepage / brand proof

Fields:

- `id`
- `name`
- `url`
- `sort_order`
- `is_live`

### `social_gallery`

Purpose:

- homepage / about lifestyle imagery

Fields:

- `id`
- `image_url`
- `caption`
- `sort_order`
- `page_target`
- `is_live`

### `blog_posts`

Purpose:

- journal page

Fields:

- `id`
- `title`
- `slug`
- `excerpt`
- `content`
- `hero_image`
- `published_at`
- `is_published`
- `seo_title`
- `seo_description`

### `reviews`

Purpose:

- real product reviews

Fields:

- `id`
- `product_id`
- `author_name`
- `rating`
- `title`
- `body`
- `is_approved`
- `created_at`

### `faqs`

Purpose:

- reusable FAQs for product / shipping / brand

Fields:

- `id`
- `question`
- `answer`
- `category`
- `sort_order`
- `is_live`

### `contact_settings`

Optional if not stored in `settings`.

Purpose:

- structured support data

Fields:

- `id`
- `support_email`
- `support_phone`
- `whatsapp_number`
- `studio_address`
- `business_hours`

---

## 4.3 Extend `settings` for singleton content

Use `settings.key` + JSON for these:

### `homepage_content`

Suggested shape:

```json
{
  "hero": {
    "eyebrow": "Premium Wooden Wall Clocks",
    "headline": "Luxury clocks crafted like heirloom objects, not ordinary wall accessories.",
    "subtext": "CHRONYX creates warm, sculptural timepieces for interiors that value material depth, calm presence, and considered craftsmanship.",
    "primaryCtaLabel": "Explore Collection",
    "secondaryCtaLabel": "Shop All"
  },
  "collectionSection": {
    "eyebrow": "Collection",
    "headline": "Designed for interiors that deserve a quieter, richer focal point.",
    "summary": "Start with the full collection..."
  },
  "trustStrip": [
    {
      "title": "Insured delivery",
      "body": "White-glove packaging and tracked dispatch."
    }
  ],
  "founderQuote": "..."
}
```

### `about_page_content`

Suggested shape:

- intro headline
- intro body
- values cards
- making-of cards

### `contact_page_content`

Suggested shape:

- intro
- support email
- support copy
- studio address
- response promise

### `footer_content`

Suggested shape:

- brand copy
- explore links
- support links
- newsletter heading
- newsletter text

### `site_navigation`

Suggested shape:

- nav links
- order
- labels
- hidden / visible state

### `policy_content`

Suggested shape:

- privacy
- terms
- refund
- shipping

### `seo_defaults`

Suggested shape:

- site title suffix
- default OG image
- default meta description
- default canonical domain

---

## 5. Storefront Mapping Plan

This is the most important wiring step.

## 5.1 Homepage

Current file:

- `D:\project\chronyx\src\pages\HomePage.jsx`

Make it read from:

- `homepage_content`
- `press_mentions`
- `testimonials`
- `social_gallery`
- optionally `collections`

### Result

Owner can change:

- hero headline
- hero description
- CTA labels
- press mentions
- testimonial entries
- gallery images
- founder quote
- trust badge text

## 5.2 About page

Current file:

- `D:\project\chronyx\src\pages\AboutPage.jsx`

Make it read from:

- `about_page_content`

### Result

Owner can change:

- story intro
- materials text
- craftsmanship text
- production philosophy
- behind-the-scenes cards

## 5.3 Blog page

Current file:

- `D:\project\chronyx\src\pages\BlogPage.jsx`

Make it read from:

- `blog_posts`

### Result

Owner can:

- add articles
- edit articles
- schedule articles
- hide drafts

## 5.4 Contact page

Current file:

- `D:\project\chronyx\src\pages\ContactPage.jsx`

Make it read from:

- `contact_page_content`
- `store_settings`

### Result

Owner can change:

- support email
- address
- WhatsApp number
- support text
- hours

## 5.5 Policies page

Current file:

- `D:\project\chronyx\src\pages\PoliciesPage.jsx`

Make it read from:

- `policy_content`

### Result

Owner can update policies from admin and see them live on the storefront.

## 5.6 Footer

Current file:

- `D:\project\chronyx\src\components\SiteFooter.jsx`

Make it read from:

- `footer_content`

### Result

Owner can change:

- footer brand text
- footer link labels
- footer support links
- newsletter wording

## 5.7 Tracking

Current file:

- `D:\project\chronyx\src\pages\TrackingPage.jsx`

Needs improvement:

- should use real order status
- should use real tracking number
- should use store-configured status copy

Possible admin controls:

- fulfilment statuses
- support note text
- delivery help text

---

## 6. New Admin Screens to Add

## 6.1 Homepage Editor

Purpose:

- central control for all homepage sections

Sections:

- hero
- featured collection
- trust strip
- testimonials
- founder quote
- social gallery
- press mentions

## 6.2 About Editor

Purpose:

- control about-page blocks

Sections:

- intro
- values cards
- making-of gallery

## 6.3 Footer Editor

Purpose:

- manage all footer text and links

Fields:

- brand copy
- column headings
- column links
- newsletter heading
- newsletter copy

## 6.4 Navigation Editor

Purpose:

- control visible nav items and labels

Fields:

- label
- route
- order
- is visible

## 6.5 Testimonials Manager

Purpose:

- add, edit, order, hide testimonials

## 6.6 Press & Social Manager

Purpose:

- manage logos/names and gallery images

## 6.7 Journal Manager

Purpose:

- create and edit blog posts

## 6.8 Reviews Manager

Purpose:

- moderate product reviews

## 6.9 Contact & Support Manager

Purpose:

- manage contact email, phone, WhatsApp, address, hours

---

## 7. Admin UX Improvements

The current admin is functional but too flat.

## 7.1 Problems in the current admin UX

- too many inline styles
- repetitive card layout
- weak grouping of related content
- content screens are too small for the amount of site content needed
- no preview-oriented editing
- no publish/draft state for content modules
- no logical distinction between “site content” and “store operations”

## 7.2 Recommended UX upgrades

### Better sidebar grouping

Group navigation like this:

- Overview
- Commerce
- Site Content
- Marketing
- Settings

### Better content forms

Use:

- grouped sections
- helper text
- content previews
- repeatable item lists
- drag-reorder for lists

### Better product editing

Split product form into tabs:

- General
- Media
- Specs
- Inventory
- Merchandising
- SEO

### Better page editing

Page editors should feel like:

- section-based forms
- not giant text dumps

Example for Homepage:

- Hero
- Featured Collection
- Trust
- Testimonials
- Founder Quote
- Gallery
- SEO

---

## 8. Recommended Build Phases

## Phase 1: Wire existing admin content into storefront

Deliverables:

- homepage hero reads from `settings`
- policies page reads from `settings`
- contact info reads from `settings`
- footer reads from `settings`
- store settings drive shipping/payment text consistently

Impact:

- immediate reduction in developer dependency

## Phase 2: Build site-content CMS modules

Deliverables:

- homepage editor
- about editor
- footer editor
- navigation editor
- testimonial manager
- press manager
- social gallery manager

Impact:

- owner can manage most brand-facing pages without code edits

## Phase 3: Add repeatable content systems

Deliverables:

- blog posts
- collections
- FAQs
- reviews

Impact:

- richer content marketing and merchandising control

## Phase 4: Improve admin UX and publishing workflow

Deliverables:

- publish/draft for page content
- better layout
- better reusable form components
- reorderable lists
- preview mode

Impact:

- admin becomes easier to use daily

## Phase 5: Advanced controls

Deliverables:

- scheduled publishing
- version history
- activity log
- multi-admin roles

Impact:

- professional long-term content operations

---

## 9. Highest Priority Missing Controls

If we only focus on the highest-value additions first, these should come first:

1. homepage section editor
2. policy content wiring
3. footer editor
4. contact/support editor
5. about page editor
6. blog system
7. testimonials manager
8. reviews manager
9. collections manager
10. navigation editor

---

## 10. Immediate Implementation Recommendation

Best next build sequence:

### Step 1

Create a unified content-read layer on the storefront:

- fetch `settings`
- normalize into `siteContent`
- pass that content into page components

### Step 2

Expand admin `Content` into:

- Homepage
- About
- Contact
- Policies
- Footer

### Step 3

Replace storefront hardcoded text with database-driven content in:

- `HomePage.jsx`
- `AboutPage.jsx`
- `ContactPage.jsx`
- `PoliciesPage.jsx`
- `SiteFooter.jsx`

### Step 4

Add:

- `testimonials`
- `press_mentions`
- `social_gallery`
- `blog_posts`

### Step 5

Refactor admin UI into reusable editor blocks.

---

## 11. Final Recommendation

Do not treat this as “just add more fields.”

Treat it as:

- a content architecture project
- a storefront data-wiring project
- an admin UX redesign project

That is how you get to a site where:

- products are manageable
- pages are manageable
- marketing is manageable
- legal text is manageable
- brand messaging is manageable
- and you no longer need a developer for normal site updates

---

## 12. Suggested Next Execution Task

The best next implementation step is:

**Build Phase 1 and Phase 2 together**

That means:

1. upgrade the admin Content area into multiple page editors
2. wire those editors into the storefront
3. make homepage, about, contact, policies, and footer fully CMS-driven

That gives the biggest return immediately.
