/**
 * Master E-commerce Template - Client Provisioning CLI
 *
 * Automates creating client-specific environment configurations for independent deployments.
 * Supports both interactive terminal prompts and non-interactive command-line arguments.
 *
 * Usage:
 *   Interactive:
 *     npm run provision-client
 *
 *   Non-interactive:
 *     npm run provision-client -- \
 *       --name "Acme Home" \
 *       --domain "https://acmehome.example" \
 *       --currency USD \
 *       --locale en-US \
 *       --theme minimal \
 *       --reviews true \
 *       --wishlist false
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { validateConfiguration, VALID_THEMES } from './validate-config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (key.includes('=')) {
        const [k, v] = key.split('=');
        params[k] = v;
      } else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        params[key] = args[++i];
      } else {
        params[key] = true;
      }
    }
  }
  return params;
}

const args = parseArgs();

// Helper for interactive prompt
function askQuestion(rl, query, defaultValue) {
  return new Promise((resolve) => {
    const prompt = defaultValue !== undefined ? `${query} (${defaultValue}): ` : `${query}: `;
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function collectConfiguration() {
  // If required flags are provided, run non-interactively
  const isNonInteractive = Boolean(args.name || args['store-name'] || args['non-interactive'] || !process.stdin.isTTY);

  if (isNonInteractive) {
    const storeName = args.name || args['store-name'] || 'New Client Store';
    const rawDomain = args.domain || args['site-url'] || 'https://example.com';
    const siteUrl = rawDomain.startsWith('http://') || rawDomain.startsWith('https://') ? rawDomain : `https://${rawDomain}`;
    const tagline = args.tagline || 'Modern Curated Goods';
    let domainHost = 'example.com';
    try {
      domainHost = new URL(siteUrl).hostname.replace('www.', '');
    } catch {
      domainHost = rawDomain.replace(/^https?:\/\//, '').replace('www.', '');
    }
    const email = args.email || `concierge@${domainHost}`;
    const currency = (args.currency || 'USD').toUpperCase();
    const symbol = args.symbol || (currency === 'USD' ? '$' : currency === 'INR' ? '₹' : '€');
    const locale = args.locale || (currency === 'USD' ? 'en-US' : currency === 'INR' ? 'en-IN' : 'en-GB');
    const decimals = args.decimals !== undefined ? String(args.decimals) : (currency === 'INR' ? '0' : '2');
    const theme = args.theme || 'minimal';

    return {
      storeName,
      tagline,
      siteUrl,
      email,
      phone: args.phone || '',
      whatsapp: args.whatsapp || '',
      currency,
      symbol,
      locale,
      decimals,
      theme,
      supabaseUrl: args['supabase-url'] || 'https://your-client-id.supabase.co',
      supabaseAnonKey: args['supabase-anon-key'] || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIn0.placeholder_signature',
      razorpayKey: args['razorpay-key'] || '',
      capabilities: {
        reviews: args.reviews !== 'false' && args.reviews !== false,
        wishlist: args.wishlist !== 'false' && args.wishlist !== false,
        coupons: args.coupons !== 'false' && args.coupons !== false,
        productVerification: args.productVerification === 'true' || args.verification === 'true',
        certificates: args.certificates === 'true',
        placementGuide: args.placementGuide === 'true',
        locationPages: args.locationPages === 'true',
        productVideo: args.productVideo !== 'false' && args.productVideo !== false,
        exitIntentPopup: args.exitIntent !== 'false' && args.exitIntent !== false,
        whatsappWidget: args.whatsappWidget === 'true' || Boolean(args.whatsapp),
      },
    };
  }

  // Interactive flow
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('\n======================================================');
  console.log('MASTER E-COMMERCE TEMPLATE — CLIENT PROVISIONING WIZARD');
  console.log('======================================================\n');

  try {
    const storeName = await askQuestion(rl, 'Store Name', 'Acme Home');
    const siteUrl = await askQuestion(rl, 'Storefront URL', 'https://acmehome.example');
    const tagline = await askQuestion(rl, 'Store Tagline', 'Fine Interior Objects');
    const email = await askQuestion(rl, 'Support Email', 'concierge@acmehome.example');

    console.log('\n--- Localization ---');
    const currency = (await askQuestion(rl, 'Currency Code (ISO 4217)', 'USD')).toUpperCase();
    const symbol = await askQuestion(rl, 'Currency Symbol', currency === 'USD' ? '$' : '₹');
    const locale = await askQuestion(rl, 'Locale Tag (BCP 47)', currency === 'USD' ? 'en-US' : 'en-IN');
    const decimals = await askQuestion(rl, 'Decimal Fraction Digits', currency === 'INR' ? '0' : '2');

    console.log('\n--- Theme Selection ---');
    console.log(`Available presets: ${VALID_THEMES.join(', ')}`);
    let theme = await askQuestion(rl, 'Theme Preset', 'minimal');
    if (!VALID_THEMES.includes(theme)) {
      console.log(`⚠ Theme "${theme}" unknown. Defaulting to "minimal".`);
      theme = 'minimal';
    }

    console.log('\n--- Supabase Configuration ---');
    const supabaseUrl = await askQuestion(rl, 'Client Supabase URL', 'https://client-id.supabase.co');
    const supabaseAnonKey = await askQuestion(rl, 'Client Supabase Anon Key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIn0.placeholder_signature');

    rl.close();

    return {
      storeName,
      tagline,
      siteUrl,
      email,
      phone: '',
      whatsapp: '',
      currency,
      symbol,
      locale,
      decimals,
      theme,
      supabaseUrl,
      supabaseAnonKey,
      razorpayKey: '',
      capabilities: {
        reviews: true,
        wishlist: true,
        coupons: true,
        productVerification: false,
        certificates: false,
        placementGuide: false,
        locationPages: false,
        productVideo: true,
        exitIntentPopup: true,
        whatsappWidget: false,
      },
    };
  } catch (err) {
    rl.close();
    throw err;
  }
}

export function generateStorefrontEnv(config) {
  return `# Generated by Master Template Client Provisioning CLI
# Date: ${new Date().toISOString()}
# Client: ${config.storeName}

# Core Supabase
VITE_SUPABASE_URL=${config.supabaseUrl}
VITE_SUPABASE_ANON_KEY=${config.supabaseAnonKey}

# Brand Identity
VITE_STORE_NAME="${config.storeName}"
VITE_STORE_TAGLINE="${config.tagline}"
VITE_SITE_URL=${config.siteUrl}
VITE_CONTACT_EMAIL=${config.email}
VITE_SUPPORT_EMAIL=${config.email}
${config.phone ? `VITE_CONTACT_PHONE="${config.phone}"` : '# VITE_CONTACT_PHONE=""'}
${config.whatsapp ? `VITE_WHATSAPP_NUMBER="${config.whatsapp}"` : '# VITE_WHATSAPP_NUMBER=""'}

# Localization & Theme
VITE_CURRENCY_CODE=${config.currency}
VITE_CURRENCY_SYMBOL=${config.symbol}
VITE_LOCALE=${config.locale}
VITE_CURRENCY_FRACTION_DIGITS=${config.decimals}
VITE_THEME=${config.theme}

# Payment Gateways
${config.razorpayKey ? `VITE_RAZORPAY_KEY_ID=${config.razorpayKey}` : '# VITE_RAZORPAY_KEY_ID=""'}

# Capabilities Profile
VITE_FEATURE_REVIEWS=${Boolean(config.capabilities.reviews)}
VITE_FEATURE_WISHLIST=${Boolean(config.capabilities.wishlist)}
VITE_FEATURE_COUPONS=${Boolean(config.capabilities.coupons)}
VITE_FEATURE_PRODUCT_VERIFICATION=${Boolean(config.capabilities.productVerification)}
VITE_FEATURE_CERTIFICATES=${Boolean(config.capabilities.certificates)}
VITE_FEATURE_PLACEMENT_GUIDE=${Boolean(config.capabilities.placementGuide)}
VITE_FEATURE_LOCATION_PAGES=${Boolean(config.capabilities.locationPages)}
VITE_FEATURE_PRODUCT_VIDEO=${Boolean(config.capabilities.productVideo)}
VITE_FEATURE_EXIT_INTENT=${Boolean(config.capabilities.exitIntentPopup)}
VITE_FEATURE_WHATSAPP_WIDGET=${Boolean(config.capabilities.whatsappWidget)}
`;
}

export function generateAdminEnv(config) {
  return `# Generated by Master Template Client Provisioning CLI (Admin)
# Date: ${new Date().toISOString()}
# Client: ${config.storeName}

VITE_SUPABASE_URL=${config.supabaseUrl}
VITE_SUPABASE_ANON_KEY=${config.supabaseAnonKey}

VITE_STORE_NAME="${config.storeName}"
VITE_STORE_TAGLINE="${config.tagline}"
VITE_STOREFRONT_URL=${config.siteUrl}
VITE_CONTACT_EMAIL=${config.email}

VITE_CURRENCY_CODE=${config.currency}
VITE_CURRENCY_SYMBOL=${config.symbol}
VITE_LOCALE=${config.locale}
VITE_CURRENCY_FRACTION_DIGITS=${config.decimals}

VITE_FEATURE_REVIEWS=${Boolean(config.capabilities.reviews)}
VITE_FEATURE_WISHLIST=${Boolean(config.capabilities.wishlist)}
VITE_FEATURE_COUPONS=${Boolean(config.capabilities.coupons)}
VITE_FEATURE_PRODUCT_VERIFICATION=${Boolean(config.capabilities.productVerification)}
VITE_FEATURE_CERTIFICATES=${Boolean(config.capabilities.certificates)}
VITE_FEATURE_PLACEMENT_GUIDE=${Boolean(config.capabilities.placementGuide)}
VITE_FEATURE_LOCATION_PAGES=${Boolean(config.capabilities.locationPages)}
VITE_FEATURE_PRODUCT_VIDEO=${Boolean(config.capabilities.productVideo)}
VITE_FEATURE_EXIT_INTENT=${Boolean(config.capabilities.exitIntentPopup)}
VITE_FEATURE_WHATSAPP_WIDGET=${Boolean(config.capabilities.whatsappWidget)}
`;
}

async function run() {
  const config = await collectConfiguration();

  const storefrontEnvContent = generateStorefrontEnv(config);
  const adminEnvContent = generateAdminEnv(config);

  // Validate the generated configuration
  const testEnv = {
    VITE_SUPABASE_URL: config.supabaseUrl,
    VITE_SUPABASE_ANON_KEY: config.supabaseAnonKey,
    VITE_STORE_NAME: config.storeName,
    VITE_SITE_URL: config.siteUrl,
    VITE_CONTACT_EMAIL: config.email,
    VITE_CURRENCY_CODE: config.currency,
    VITE_CURRENCY_SYMBOL: config.symbol,
    VITE_LOCALE: config.locale,
    VITE_CURRENCY_FRACTION_DIGITS: config.decimals,
    VITE_THEME: config.theme,
    VITE_FEATURE_REVIEWS: String(config.capabilities.reviews),
    VITE_FEATURE_WISHLIST: String(config.capabilities.wishlist),
    VITE_FEATURE_COUPONS: String(config.capabilities.coupons),
    VITE_FEATURE_PRODUCT_VERIFICATION: String(config.capabilities.productVerification),
    VITE_FEATURE_CERTIFICATES: String(config.capabilities.certificates),
    VITE_FEATURE_PLACEMENT_GUIDE: String(config.capabilities.placementGuide),
    VITE_FEATURE_LOCATION_PAGES: String(config.capabilities.locationPages),
    VITE_FEATURE_PRODUCT_VIDEO: String(config.capabilities.productVideo),
    VITE_FEATURE_EXIT_INTENT: String(config.capabilities.exitIntentPopup),
    VITE_FEATURE_WHATSAPP_WIDGET: String(config.capabilities.whatsappWidget),
  };

  const validation = validateConfiguration(testEnv);

  console.log('\n--- Provisioning Verification ---');
  if (validation.warnings.length > 0) {
    validation.warnings.forEach((w) => console.log(`⚠ ${w}`));
  }

  if (validation.errors.length > 0) {
    validation.errors.forEach((e) => console.error(`✖ ${e}`));
    console.error('\nProvisioning aborted due to configuration errors.\n');
    process.exit(1);
  }

  console.log('✔ Configuration passed validation rules.');

  // If dry-run, output and return
  if (args['dry-run']) {
    console.log('\n[DRY-RUN] Storefront .env Output:\n');
    console.log(storefrontEnvContent);
    console.log('\n[DRY-RUN] Admin .env Output:\n');
    console.log(adminEnvContent);
    console.log('✔ Dry run completed. No files modified.\n');
    return;
  }

  // Determine output destinations
  const writeDirectEnv = Boolean(args['write-env']);
  const storefrontOut = writeDirectEnv ? path.join(rootDir, '.env') : path.join(rootDir, '.env.client');
  const adminOut = writeDirectEnv ? path.join(rootDir, 'admin-panel', '.env') : path.join(rootDir, 'admin-panel', '.env.client');

  fs.writeFileSync(storefrontOut, storefrontEnvContent, 'utf8');
  fs.writeFileSync(adminOut, adminEnvContent, 'utf8');

  console.log(`\n✔ Generated Storefront configuration: ${path.relative(rootDir, storefrontOut)}`);
  console.log(`✔ Generated Admin configuration:      ${path.relative(rootDir, adminOut)}`);
  console.log('\n🎉 Client provisioning complete!');
  console.log('Next steps for fresh client deployment:');
  console.log('  1. Review generated environment: .env.client & admin-panel/.env.client');
  console.log('  2. Push migrations to Supabase: npm run provision-supabase');
  console.log('  3. Seed baseline settings:      npm run seed-database');
  console.log('  4. Verify storage/media setup:   npm run provision-storage');
  console.log('  5. Bootstrap initial admin:      npm run bootstrap-admin -- --email "<admin_email>"');
  console.log('  6. Run deployment preflight:     npm run preflight');
  console.log('  7. Run production builds:        npm run build && npm --prefix admin-panel run build\n');
}

run().catch((err) => {
  console.error('Provisioning error:', err);
  process.exit(1);
});
