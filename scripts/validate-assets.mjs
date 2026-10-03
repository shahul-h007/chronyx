/**
 * Master E-commerce Template - Static Asset Validator
 *
 * Checks that all required core template and client branding assets are present and valid.
 * Warns if a customized client deployment is still using demo Chronyx imagery.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export const ASSET_MANIFEST = {
  coreTemplate: [
    { file: 'public/robots.txt', description: 'Search engine crawler rules', required: true },
    { file: 'public/sitemap.xml', description: 'XML Sitemap index', required: true },
  ],
  clientBranding: [
    { file: 'public/brand/logo-full.png', description: 'Primary full brand logo', required: true },
    { file: 'public/brand/mark.png', description: 'Brand icon/mark', required: true },
    { file: 'public/brand/favicon.png', description: 'Browser tab favicon', required: true },
    { file: 'public/brand/apple-touch-icon.png', description: 'Mobile home-screen icon', required: true },
  ],
  optional: [
    { file: 'public/video-sitemap.xml', description: 'Video structured data sitemap', required: false },
    { file: 'public/favicon.svg', description: 'Scalable vector favicon fallback', required: false },
  ],
};

// Known demo asset sizes for Chronyx (to detect unreplaced placeholder assets)
const CHRONYX_DEMO_SIZES = {
  'public/brand/logo-full.png': 83383,
  'public/brand/mark.png': 34991,
  'public/brand/favicon.png': 34991,
  'public/brand/apple-touch-icon.png': 11880,
};

export function validateAssets({ storeName = 'CHRONYX' } = {}) {
  const errors = [];
  const warnings = [];
  const passed = [];

  // 1. Validate Core Template Assets
  for (const asset of ASSET_MANIFEST.coreTemplate) {
    const fullPath = path.join(rootDir, asset.file);
    if (!fs.existsSync(fullPath)) {
      if (asset.required) {
        errors.push(`Missing required core asset: ${asset.file} (${asset.description})`);
      } else {
        warnings.push(`Optional core asset missing: ${asset.file}`);
      }
    } else {
      passed.push(asset.file);
    }
  }

  // 2. Validate Client Branding Assets
  const isCustomClient = storeName.toUpperCase() !== 'CHRONYX';

  for (const asset of ASSET_MANIFEST.clientBranding) {
    const fullPath = path.join(rootDir, asset.file);
    if (!fs.existsSync(fullPath)) {
      if (asset.required) {
        errors.push(`Missing required brand asset: ${asset.file} (${asset.description})`);
      } else {
        warnings.push(`Brand asset missing: ${asset.file}`);
      }
    } else {
      passed.push(asset.file);
      // Check if custom client has replaced the demo assets
      if (isCustomClient && CHRONYX_DEMO_SIZES[asset.file]) {
        try {
          const stats = fs.statSync(fullPath);
          if (stats.size === CHRONYX_DEMO_SIZES[asset.file]) {
            warnings.push(
              `Client "${storeName}" is still using default Chronyx demo asset for ${asset.file}. Remember to replace it with "${storeName}" branding before launch.`
            );
          }
        } catch {}
      }
    }
  }

  // 3. Optional Assets
  for (const asset of ASSET_MANIFEST.optional) {
    const fullPath = path.join(rootDir, asset.file);
    if (fs.existsSync(fullPath)) {
      passed.push(asset.file);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    passed,
  };
}

// Standalone execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('\n========================================');
  console.log('MASTER E-COMMERCE TEMPLATE — ASSET VALIDATION');
  console.log('========================================\n');

  const storeName = process.env.VITE_STORE_NAME || 'CHRONYX';
  const result = validateAssets({ storeName });

  if (result.warnings.length > 0) {
    console.log('WARNINGS:');
    result.warnings.forEach((w) => console.log(`  ⚠ ${w}`));
    console.log('');
  }

  if (result.errors.length > 0) {
    console.error('ERRORS:');
    result.errors.forEach((e) => console.error(`  ✖ ${e}`));
    console.error('\n✖ Asset validation FAILED.\n');
    process.exit(1);
  } else {
    result.passed.forEach((file) => console.log(`  ✔ Verified asset: ${file}`));
    console.log(`\n✔ Static asset validation PASSED (${result.passed.length} assets verified).\n`);
    process.exit(0);
  }
}
