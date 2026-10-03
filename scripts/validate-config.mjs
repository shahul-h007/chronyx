/**
 * Master E-commerce Template - Configuration Validator
 *
 * Runs comprehensive integrity, type, schema, and security checks on store configuration.
 * Can be run standalone (`npm run validate-config`) or as part of preflight.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment from .env if present (without overriding existing process.env)
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
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
  return env;
}

const fileEnv = loadEnvFile(path.join(rootDir, '.env'));
const mergedEnv = { ...fileEnv, ...process.env };

export const VALID_THEMES = ['chronyx', 'minimal', 'warmEditorial'];

export const VALID_CAPABILITY_KEYS = [
  'reviews',
  'wishlist',
  'coupons',
  'productVerification',
  'certificates',
  'placementGuide',
  'locationPages',
  'productVideo',
  'exitIntentPopup',
  'whatsappWidget',
  'journal',
];

export const VALID_ENV_CAPABILITIES = {
  VITE_FEATURE_REVIEWS: 'reviews',
  VITE_FEATURE_WISHLIST: 'wishlist',
  VITE_FEATURE_COUPONS: 'coupons',
  VITE_FEATURE_PRODUCT_VERIFICATION: 'productVerification',
  VITE_FEATURE_CERTIFICATES: 'certificates',
  VITE_FEATURE_PLACEMENT_GUIDE: 'placementGuide',
  VITE_FEATURE_LOCATION_PAGES: 'locationPages',
  VITE_FEATURE_PRODUCT_VIDEO: 'productVideo',
  VITE_FEATURE_EXIT_INTENT: 'exitIntentPopup',
  VITE_FEATURE_WHATSAPP_WIDGET: 'whatsappWidget',
};

export function validateConfiguration(env = mergedEnv) {
  const errors = [];
  const warnings = [];

  // 1. Core Supabase Environment
  const supabaseUrl = env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    errors.push('Missing required environment variable: VITE_SUPABASE_URL');
  } else {
    try {
      const parsed = new URL(supabaseUrl);
      if (!parsed.protocol.startsWith('https')) {
        errors.push(`VITE_SUPABASE_URL must be an HTTPS URL. Received: "${supabaseUrl}"`);
      }
    } catch {
      errors.push(`Invalid VITE_SUPABASE_URL format. Received: "${supabaseUrl}"`);
    }
  }

  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseAnonKey) {
    errors.push('Missing required environment variable: VITE_SUPABASE_ANON_KEY');
  } else if (supabaseAnonKey.split('.').length !== 3) {
    errors.push('VITE_SUPABASE_ANON_KEY must be a valid JWT (3 dot-separated segments).');
  }

  // 2. Security Check: Forbid private secrets in browser-accessible VITE_* variables
  const dangerousPatterns = ['service_role', 'secret', 'private', 'resend', 'key_secret'];
  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith('VITE_')) continue;
    const lowerKey = key.toLowerCase();
    for (const pattern of dangerousPatterns) {
      if (lowerKey.includes(pattern) && !lowerKey.includes('anon') && !lowerKey.includes('publishable')) {
        errors.push(`SECURITY ERROR: Secret exposure detected! Variable "${key}" contains sensitive keyword "${pattern}". Private secrets must never use the VITE_ prefix.`);
      }
    }
    if (typeof value === 'string' && value.startsWith('re_') && lowerKey.includes('vite')) {
      errors.push(`SECURITY ERROR: Resend API secret detected in browser variable "${key}".`);
    }
  }

  // 3. Store Identity
  const storeName = env.VITE_STORE_NAME || 'CHRONYX';
  if (!storeName || storeName.trim().length === 0) {
    errors.push('VITE_STORE_NAME cannot be empty.');
  }

  const siteUrl = env.VITE_SITE_URL || 'https://chronyx.in';
  try {
    const parsedUrl = new URL(siteUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      errors.push(`VITE_SITE_URL must use http:// or https:// protocol. Received: "${siteUrl}"`);
    }
  } catch {
    errors.push(`Invalid VITE_SITE_URL URL format: "${siteUrl}"`);
  }

  // 4. Contact Information
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (env.VITE_CONTACT_EMAIL && !emailRegex.test(env.VITE_CONTACT_EMAIL)) {
    errors.push(`Invalid VITE_CONTACT_EMAIL format: "${env.VITE_CONTACT_EMAIL}"`);
  }
  if (env.VITE_SUPPORT_EMAIL && !emailRegex.test(env.VITE_SUPPORT_EMAIL)) {
    errors.push(`Invalid VITE_SUPPORT_EMAIL format: "${env.VITE_SUPPORT_EMAIL}"`);
  }

  // 5. Localization & Currency
  const currencyCode = (env.VITE_CURRENCY_CODE || 'INR').toUpperCase();
  if (!/^[A-Z]{3}$/.test(currencyCode)) {
    errors.push(`VITE_CURRENCY_CODE must be a 3-letter ISO-4217 code. Received: "${currencyCode}"`);
  }

  const locale = env.VITE_LOCALE || 'en-IN';
  if (!/^[a-z]{2}(-[A-Z]{2,4})?$/i.test(locale)) {
    warnings.push(`VITE_LOCALE "${locale}" may not conform to standard BCP-47 tag (e.g. "en-US", "en-IN").`);
  }

  if (env.VITE_CURRENCY_FRACTION_DIGITS !== undefined) {
    const digits = Number(env.VITE_CURRENCY_FRACTION_DIGITS);
    if (!Number.isInteger(digits) || digits < 0 || digits > 4) {
      errors.push(`VITE_CURRENCY_FRACTION_DIGITS must be an integer between 0 and 4. Received: "${env.VITE_CURRENCY_FRACTION_DIGITS}"`);
    }
  }

  // 6. Theme Validation
  const theme = env.VITE_THEME || 'chronyx';
  if (!VALID_THEMES.includes(theme)) {
    errors.push(`Theme "${theme}" does not exist. Available themes: ${VALID_THEMES.join(', ')}`);
  }

  // 7. Capability & Feature Flags
  // Detect unrecognized VITE_FEATURE_* variables (typo protection)
  for (const key of Object.keys(env)) {
    if (key.startsWith('VITE_FEATURE_')) {
      if (!(key in VALID_ENV_CAPABILITIES)) {
        errors.push(`Unknown capability flag "${key}". Valid flags: ${Object.keys(VALID_ENV_CAPABILITIES).join(', ')}`);
      } else {
        const val = String(env[key]).toLowerCase();
        if (!['true', 'false', '1', '0', 'yes', 'no'].includes(val)) {
          errors.push(`Invalid boolean value for "${key}": "${env[key]}". Expected true or false.`);
        }
      }
    }
  }

  // 8. Payment Gateway & Currency Compatibility Boundary
  const razorpayKey = env.VITE_RAZORPAY_KEY_ID;
  if (razorpayKey && !razorpayKey.startsWith('rzp_test_') && !razorpayKey.startsWith('rzp_live_')) {
    warnings.push(`VITE_RAZORPAY_KEY_ID does not match expected pattern (rzp_test_* or rzp_live_*).`);
  }

  if (currencyCode !== 'INR' && razorpayKey) {
    warnings.push(`Configured currency is "${currencyCode}" with Razorpay Gateway. Verify that International Payments are activated in your Razorpay Dashboard.`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      storeName,
      currency: currencyCode,
      locale,
      theme,
      capabilitiesChecked: Object.keys(VALID_ENV_CAPABILITIES).length,
    },
  };
}

// Standalone execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('\n========================================');
  console.log('MASTER E-COMMERCE TEMPLATE — CONFIG VALIDATION');
  console.log('========================================\n');

  const result = validateConfiguration();

  if (result.warnings.length > 0) {
    console.log('WARNINGS:');
    result.warnings.forEach((w) => console.log(`  ⚠ ${w}`));
    console.log('');
  }

  if (result.errors.length > 0) {
    console.error('ERRORS:');
    result.errors.forEach((e) => console.error(`  ✖ ${e}`));
    console.error('\n✖ Configuration validation FAILED.\n');
    process.exit(1);
  } else {
    console.log(`✔ Store Name: ${result.summary.storeName}`);
    console.log(`✔ Currency:   ${result.summary.currency} (${result.summary.locale})`);
    console.log(`✔ Theme:      ${result.summary.theme}`);
    console.log(`✔ Flags:      ${result.summary.capabilitiesChecked} capabilities validated`);
    console.log('\n✔ Configuration validation PASSED cleanly.\n');
    process.exit(0);
  }
}
