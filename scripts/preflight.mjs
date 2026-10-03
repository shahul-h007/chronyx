/**
 * Master E-commerce Template - Deployment Preflight Runner
 *
 * Runs end-to-end verification checks prior to Vercel/production deployment.
 * Validates environment, configuration, capabilities, themes, currency, payment boundaries, and assets.
 * Exits with code 1 if any ERRORS are detected.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateConfiguration, VALID_THEMES } from './validate-config.mjs';
import { validateAssets } from './validate-assets.mjs';
import { verifyStorageConfiguration } from './provision-storage.mjs';
import { validatePaymentCurrencyCompatibility } from '../src/lib/paymentProviders.js';
import { TEMPLATE_MANIFEST } from '../src/config/templateVersion.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Terminal color helpers
const reset = '\x1b[0m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const red = '\x1b[31m';
const bold = '\x1b[1m';
const cyan = '\x1b[36m';

function formatBadge(status) {
  switch (status) {
    case 'PASS':
      return `${green}${bold}[PASS]${reset}`;
    case 'WARN':
      return `${yellow}${bold}[WARN]${reset}`;
    case 'FAIL':
      return `${red}${bold}[FAIL]${reset}`;
    default:
      return `[${status}]`;
  }
}

// Load environment from .env
function loadEnv() {
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) return process.env;
  const content = fs.readFileSync(envPath, 'utf8');
  const env = { ...process.env };
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

export function runPreflight() {
  const env = loadEnv();
  const checks = [];

  console.log(`\n${bold}================================================================${reset}`);
  console.log(`${bold}${cyan}MASTER E-COMMERCE TEMPLATE — DEPLOYMENT PREFLIGHT CHECK${reset}`);
  console.log(`${bold}Template Engine Version: ${TEMPLATE_MANIFEST.version} (${TEMPLATE_MANIFEST.codename})${reset}`);
  console.log(`${bold}================================================================${reset}\n`);

  // 1. Core Environment & Configuration Validation
  const configResult = validateConfiguration(env);
  if (configResult.errors.length > 0) {
    checks.push({
      name: 'Configuration Integrity',
      status: 'FAIL',
      messages: configResult.errors,
    });
  } else if (configResult.warnings.length > 0) {
    checks.push({
      name: 'Configuration Integrity',
      status: 'WARN',
      messages: configResult.warnings,
    });
  } else {
    checks.push({
      name: 'Configuration Integrity',
      status: 'PASS',
      details: `${configResult.summary.storeName} (${configResult.summary.currency})`,
    });
  }

  // 2. Theme System Validation
  const activeTheme = env.VITE_THEME || 'chronyx';
  if (!VALID_THEMES.includes(activeTheme)) {
    checks.push({
      name: 'Theme System',
      status: 'FAIL',
      messages: [`Theme "${activeTheme}" is invalid. Must be one of: ${VALID_THEMES.join(', ')}`],
    });
  } else {
    const cssPath = path.join(rootDir, 'src', 'styles.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    const expectedSelector = activeTheme === 'chronyx' ? 'html[data-theme=\'maple\']' : `html[data-theme='${activeTheme === 'warmEditorial' ? 'warm-editorial' : activeTheme}']`;
    if (!cssContent.includes(expectedSelector)) {
      checks.push({
        name: 'Theme System',
        status: 'FAIL',
        messages: [`CSS selector "${expectedSelector}" not found in src/styles.css`],
      });
    } else {
      checks.push({
        name: 'Theme System',
        status: 'PASS',
        details: `Active preset: ${activeTheme}`,
      });
    }
  }

  // 3. Static Asset Validation
  const assetResult = validateAssets({ storeName: env.VITE_STORE_NAME || 'CHRONYX' });
  if (assetResult.errors.length > 0) {
    checks.push({
      name: 'Static Branding Assets',
      status: 'FAIL',
      messages: assetResult.errors,
    });
  } else if (assetResult.warnings.length > 0) {
    checks.push({
      name: 'Static Branding Assets',
      status: 'WARN',
      messages: assetResult.warnings,
    });
  } else {
    checks.push({
      name: 'Static Branding Assets',
      status: 'PASS',
      details: `${assetResult.passed.length} assets verified`,
    });
  }

  // 4. Payment Gateway & Currency Compatibility Boundary
  const currencyCode = env.VITE_CURRENCY_CODE || 'INR';
  const razorpayKey = env.VITE_RAZORPAY_KEY_ID;
  if (razorpayKey) {
    const paymentCheck = validatePaymentCurrencyCompatibility('razorpay', currencyCode);
    if (!paymentCheck.compatible) {
      checks.push({
        name: 'Payment Gateway Boundary',
        status: 'FAIL',
        messages: [paymentCheck.error],
      });
    } else if (paymentCheck.warning) {
      checks.push({
        name: 'Payment Gateway Boundary',
        status: 'WARN',
        messages: [paymentCheck.warning],
      });
    } else {
      checks.push({
        name: 'Payment Gateway Boundary',
        status: 'PASS',
        details: `Razorpay configured for native ${currencyCode}`,
      });
    }
  } else {
    checks.push({
      name: 'Payment Gateway Boundary',
      status: 'PASS',
      details: 'Offline / COD mode active (No online gateway keys configured)',
    });
  }

  // 5. Admin Panel Configuration Sanity
  const adminEnvPath = path.join(rootDir, 'admin-panel', '.env');
  const adminIndexHtml = path.join(rootDir, 'admin-panel', 'index.html');
  if (!fs.existsSync(adminIndexHtml)) {
    checks.push({
      name: 'Admin Panel Readiness',
      status: 'FAIL',
      messages: ['admin-panel/index.html not found.'],
    });
  } else if (!fs.existsSync(adminEnvPath)) {
    checks.push({
      name: 'Admin Panel Readiness',
      status: 'WARN',
      messages: ['admin-panel/.env not found. Admin will fall back to default configuration.'],
    });
  } else {
    checks.push({
      name: 'Admin Panel Readiness',
      status: 'PASS',
      details: 'Admin panel structure and configuration present',
    });
  }

  // 6. Media & Storage Upload Readiness
  const storageResult = verifyStorageConfiguration();
  if (!storageResult.valid) {
    checks.push({
      name: 'Storage & Media Configuration',
      status: 'FAIL',
      messages: storageResult.issues.map((i) => i.message),
    });
  } else if (storageResult.hasWarnings) {
    checks.push({
      name: 'Storage & Media Configuration',
      status: 'WARN',
      messages: storageResult.issues.map((i) => i.message),
    });
  } else {
    checks.push({
      name: 'Storage & Media Configuration',
      status: 'PASS',
      details: 'Cloudinary/Media upload presets configured',
    });
  }

  // 7. Security Audit: Check gitignore covers .env
  const gitignorePath = path.join(rootDir, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignoreContent.includes('.env')) {
      checks.push({
        name: 'Security & Secret Isolation',
        status: 'FAIL',
        messages: ['.gitignore does not ignore .env files!'],
      });
    } else {
      checks.push({
        name: 'Security & Secret Isolation',
        status: 'PASS',
        details: '.env and secrets properly git-ignored',
      });
    }
  }

  // Print Report
  let hasFailures = false;
  let hasWarnings = false;

  for (const check of checks) {
    console.log(`${formatBadge(check.status)}  ${bold}${check.name}${reset}`);
    if (check.details) {
      console.log(`        └─ ${check.details}`);
    }
    if (check.messages) {
      for (const msg of check.messages) {
        const icon = check.status === 'FAIL' ? `${red}✖${reset}` : `${yellow}⚠${reset}`;
        console.log(`        └─ ${icon} ${msg}`);
      }
    }
    if (check.status === 'FAIL') hasFailures = true;
    if (check.status === 'WARN') hasWarnings = true;
  }

  console.log(`\n${bold}================================================================${reset}`);
  if (hasFailures) {
    console.log(`${red}${bold}PREFLIGHT STATUS: FAILED (Blocking deployment)${reset}`);
    console.log(`${bold}Fix the listed failure conditions above before deploying.${reset}\n`);
    return false;
  }

  if (hasWarnings) {
    console.log(`${yellow}${bold}PREFLIGHT STATUS: PASSED WITH WARNINGS${reset}`);
    console.log(`${bold}Review warnings above. Build is deployable.${reset}\n`);
    return true;
  }

  console.log(`${green}${bold}PREFLIGHT STATUS: ALL CHECKS PASSED${reset}`);
  console.log(`${bold}Master Template is hardened and ready for deployment.${reset}\n`);
  return true;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const passed = runPreflight();
  process.exit(passed ? 0 : 1);
}
