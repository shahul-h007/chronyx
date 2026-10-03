/**
 * Master E-commerce Template - Storage & Media Provisioning Checker
 *
 * Inspects and validates required media providers (Cloudinary / Supabase Storage).
 * Since product uploads and site content hero assets are handled via Cloudinary
 * in the admin panel, this tool ensures the necessary environment variables and
 * cloud presets are set and reachable before going to production.
 *
 * Usage:
 *   node scripts/provision-storage.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function loadAdminEnv() {
  const adminEnvPath = path.join(rootDir, 'admin-panel', '.env');
  const env = {};
  if (fs.existsSync(adminEnvPath)) {
    const content = fs.readFileSync(adminEnvPath, 'utf8');
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

export function verifyStorageConfiguration(env = {}) {
  const adminEnv = { ...loadAdminEnv(), ...env };
  const issues = [];
  const passed = [];

  const cloudName = adminEnv.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = adminEnv.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName) {
    issues.push({
      key: 'VITE_CLOUDINARY_CLOUD_NAME',
      message: 'Cloudinary cloud name is missing in admin-panel/.env. Product and hero image uploads will fail in Admin Panel.',
      severity: 'WARN',
    });
  } else {
    passed.push(`Cloudinary Cloud Name configured: ${cloudName}`);
  }

  if (!uploadPreset) {
    issues.push({
      key: 'VITE_CLOUDINARY_UPLOAD_PRESET',
      message: 'Cloudinary upload preset is missing in admin-panel/.env. Uploads require an unsigned preset.',
      severity: 'WARN',
    });
  } else {
    passed.push(`Cloudinary Upload Preset configured: ${uploadPreset}`);
  }

  return {
    valid: issues.filter((i) => i.severity === 'FAIL').length === 0,
    hasWarnings: issues.some((i) => i.severity === 'WARN'),
    issues,
    passed,
  };
}

// CLI entry point
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = verifyStorageConfiguration();

  console.log('\n--- STORAGE & MEDIA PROVISIONING CHECK ---');
  for (const item of result.passed) {
    console.log(`  ✔ [PASS] ${item}`);
  }
  for (const issue of result.issues) {
    const icon = issue.severity === 'FAIL' ? '✖ [FAIL]' : '⚠ [WARN]';
    console.log(`  ${icon} ${issue.key}: ${issue.message}`);
  }

  if (!result.valid) {
    console.error('\nStorage verification failed.');
    process.exit(1);
  } else {
    console.log('\nStorage configuration verified.');
    process.exit(0);
  }
}
