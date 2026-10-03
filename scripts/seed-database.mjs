/**
 * Master E-commerce Template - Database Baseline Seeder
 *
 * Seeds baseline records into the `settings` table in a fresh Supabase database.
 * This script is 100% idempotent: running it multiple times will safely UPSERT
 * without creating duplicates or destroying existing client custom data.
 *
 * Usage:
 *   node scripts/seed-database.mjs
 *   node scripts/seed-database.mjs --store-name "Acme Home" --currency "USD" --email "hello@acmehome.example"
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function loadEnv() {
  const envPath = path.join(rootDir, '.env');
  const env = { ...process.env };
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        env[key] = val;
      }
    }
  }
  return env;
}

export function buildBaselineSettings(clientConfig = {}) {
  const storeName = clientConfig.storeName || 'Store';
  const contactEmail = clientConfig.contactEmail || `hello@${clientConfig.domain || 'example.com'}`;
  const supportEmail = clientConfig.supportEmail || contactEmail;

  return [
    {
      key: 'store_settings',
      value: {
        store_name: storeName,
        contact_email: contactEmail,
        whatsapp_number: clientConfig.whatsappNumber || '',
        maintenance_mode: false,
        cod_enabled: true,
        cod_fee: 0,
        free_shipping_threshold: 0,
        express_shipping_enabled: false,
        express_shipping_fee: 0,
        upi_enabled: false,
        card_enabled: true,
        netbanking_enabled: false,
        show_journal: clientConfig.showJournal ?? false,
      },
    },
    {
      key: 'navigation_content',
      value: {
        links: [
          { label: 'Home', path: '/', visible: true },
          { label: 'Shop', path: '/shop', visible: true },
          { label: 'About', path: '/about', visible: true },
          { label: 'Journal', path: '/blog', visible: Boolean(clientConfig.showJournal) },
          { label: 'Contact', path: '/contact', visible: true },
        ],
      },
    },
    {
      key: 'footer_content',
      value: {
        tagline: `${storeName} — Curated lifestyle and modern design.`,
        exploreLinks: [
          { label: 'Shop All', path: '/shop', visible: true },
          { label: 'Our Story', path: '/about', visible: true },
          { label: 'Journal', path: '/blog', visible: Boolean(clientConfig.showJournal) },
          { label: 'Contact', path: '/contact', visible: true },
        ],
        supportLinks: [
          { label: 'Privacy & Policies', path: '/policies', visible: true },
          { label: 'Track Order', path: '/track', visible: true },
          { label: 'My Account', path: '/account', visible: true },
        ],
      },
    },
    {
      key: 'hero_text',
      value: {
        headline: `Modern living, crafted with intention for ${storeName}.`,
        subtext: `Discover pieces designed with uncompromising attention to detail and everyday beauty.`,
      },
    },
    {
      key: 'store_policies',
      value: {
        shippingPolicy: `Standard shipping delivers within 3-5 business days. Express options are available at checkout.`,
        returnPolicy: `We accept returns of unused items within 30 days of delivery in their original condition.`,
        privacyPolicy: `${storeName} respects your privacy. We collect only necessary details to fulfill your order securely.`,
        termsOfService: `By accessing this store, you agree to our standard terms and conditions of commerce.`,
      },
    },
    {
      key: 'about_page_content',
      value: {
        title: `About ${storeName}`,
        story: `${storeName} was established to offer timeless, functional pieces designed to elevate everyday rituals.`,
        storyCards: [
          { title: 'Material First', body: 'We prioritize authentic, durable materials that age gracefully.' },
          { title: 'Conscious Craft', body: 'Thoughtfully designed objects created in limited, considered batches.' },
        ],
        makingOfItems: [],
      },
    },
    {
      key: 'contact_page_content',
      value: {
        headline: 'Get in Touch',
        subtext: 'We are here to assist with product inquiries, order tracking, and bespoke requests.',
        supportEmail: supportEmail,
        responseCommitment: 'We typically respond to inquiries within one business day.',
        faqItems: [
          { question: 'How do I track my order?', answer: 'Use the Track Order link in the footer with your Order ID.' },
          { question: 'What is your return policy?', answer: 'We offer 30-day hassle-free returns on standard items.' },
        ],
      },
    },
    {
      key: 'homepage_content',
      value: {
        heroEyebrow: 'New Collection',
        collectionEyebrow: 'Featured Catalog',
        collectionHeadline: 'Objects made for mindful living.',
        collectionSummary: 'Explore our catalog of intentional objects and home essentials.',
        socialEyebrow: 'Follow Along',
        socialHeadline: `@${storeName.toLowerCase().replace(/\s+/g, '')}.studio`,
        founderQuote: 'Designed for spaces that value quiet elegance and lasting quality.',
        trustItems: [
          { title: 'Complimentary Shipping', body: 'On eligible orders with tracked delivery.' },
          { title: 'Artisan Quality', body: 'Crafted with premium materials and precision.' },
          { title: 'Secure Checkout', body: 'Encrypted end-to-end payment transactions.' },
        ],
        pressMentions: [],
        testimonials: [],
        socialImages: [],
      },
    },
  ];
}

export async function seedDatabase(options = {}) {
  const env = loadEnv();
  const supabaseUrl = options.supabaseUrl || env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  // Seeding settings requires admin permissions (service_role) OR authenticated admin user
  const serviceKey = options.serviceRoleKey || env.SUPABASE_SERVICE_ROLE_KEY || options.anonKey || env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Supabase URL is required. Set VITE_SUPABASE_URL in .env or pass --supabase-url.');
  }
  if (!serviceKey) {
    throw new Error('Supabase key is required. Set SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY.');
  }

  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const clientConfig = {
    storeName: options.storeName || env.VITE_STORE_NAME || 'Store',
    domain: options.domain || env.VITE_STORE_DOMAIN || 'example.com',
    contactEmail: options.contactEmail || env.VITE_CONTACT_EMAIL,
    supportEmail: options.supportEmail || env.VITE_SUPPORT_EMAIL,
    whatsappNumber: options.whatsappNumber || '',
    showJournal: options.showJournal !== undefined ? options.showJournal : (env.VITE_CAPABILITY_JOURNAL === 'true'),
  };

  const records = buildBaselineSettings(clientConfig);
  console.log(`Seeding baseline settings for: ${clientConfig.storeName}...`);

  const results = [];
  for (const record of records) {
    const { data, error } = await client
      .from('settings')
      .upsert(
        {
          key: record.key,
          value: record.value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      )
      .select();

    if (error) {
      console.warn(`  ⚠ Warning seeding "${record.key}": ${error.message}`);
      results.push({ key: record.key, status: 'FAILED', error: error.message });
    } else {
      console.log(`  ✔ Seeded "${record.key}"`);
      results.push({ key: record.key, status: 'SEEDED' });
    }
  }

  return { success: results.every((r) => r.status === 'SEEDED'), results };
}

// CLI entry point
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--store-name') options.storeName = args[++i];
    if (args[i] === '--domain') options.domain = args[++i];
    if (args[i] === '--email') options.contactEmail = args[++i];
    if (args[i] === '--supabase-url') options.supabaseUrl = args[++i];
    if (args[i] === '--service-key') options.serviceRoleKey = args[++i];
  }

  seedDatabase(options)
    .then((res) => {
      if (res.success) {
        console.log('\nAll baseline settings seeded successfully.');
        process.exit(0);
      } else {
        console.log('\nSeeding completed with warnings/errors. Review output above.');
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('\nSeeding failed:', err.message);
      process.exit(1);
    });
}
