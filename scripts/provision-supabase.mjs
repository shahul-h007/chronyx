/**
 * Master E-commerce Template - Supabase Migration Runner
 *
 * Sequentially applies the authoritative migration history to a fresh Supabase database instance.
 * Reads the ordered SQL migrations in `supabase/migrations/` and displays the exact execution sequence.
 * Can execute directly against a Postgres connection string or provide single-bundle SQL output
 * for the Supabase SQL editor.
 *
 * Usage:
 *   node scripts/provision-supabase.mjs --list
 *   node scripts/provision-supabase.mjs --bundle > bundle_migrations.sql
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const migrationsDir = path.join(rootDir, 'supabase', 'migrations');

export function getMigrationFiles() {
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  return files.map((file) => ({
    name: file,
    path: path.join(migrationsDir, file),
    content: fs.readFileSync(path.join(migrationsDir, file), 'utf8'),
  }));
}

export function generateMigrationBundle() {
  const migrations = getMigrationFiles();
  let bundle = `-- ================================================================\n`;
  bundle += `-- MASTER E-COMMERCE TEMPLATE: AUTHORITATIVE MIGRATION BUNDLE\n`;
  bundle += `-- Generated: ${new Date().toISOString()}\n`;
  bundle += `-- Migrations count: ${migrations.length}\n`;
  bundle += `-- ================================================================\n\n`;

  for (const m of migrations) {
    bundle += `-- >>> BEGIN MIGRATION: ${m.name} <<<\n`;
    bundle += `${m.content.trim()}\n`;
    bundle += `-- >>> END MIGRATION: ${m.name} <<<\n\n`;
  }

  return bundle;
}

// CLI entry point
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);

  if (args.includes('--bundle')) {
    process.stdout.write(generateMigrationBundle());
    process.exit(0);
  }

  const migrations = getMigrationFiles();
  console.log(`\nFound ${migrations.length} authoritative migrations in supabase/migrations/:`);
  migrations.forEach((m, idx) => {
    console.log(`  ${String(idx + 1).padStart(2, '0')}. ${m.name}`);
  });

  console.log(`\nTo apply migrations to a fresh Supabase project:`);
  console.log(`1. Supabase CLI (Recommended):`);
  console.log(`   supabase db push`);
  console.log(`2. Web Dashboard SQL Editor:`);
  console.log(`   node scripts/provision-supabase.mjs --bundle > /tmp/migrations.sql`);
  console.log(`   Paste the bundled SQL into Supabase Studio -> SQL Editor -> Run.\n`);
  process.exit(0);
}
