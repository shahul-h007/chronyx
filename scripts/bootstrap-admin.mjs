/**
 * Master E-commerce Template - Admin User Bootstrap Script
 *
 * Safely provisions or grants administrator access to the primary store owner:
 * 1. Inserts the owner's email into `public.admin_users` table so PostgreSQL RLS policies
 *    recognize `public.is_admin()` as true.
 * 2. Optionally invites or registers the user in Supabase Auth via Admin API (if service_role key provided).
 *
 * Never weakens RLS policies or bypasses Supabase Auth.
 *
 * Usage:
 *   node scripts/bootstrap-admin.mjs --email "owner@example.com"
 *   node scripts/bootstrap-admin.mjs --email "owner@example.com" --service-key "<SUPABASE_SERVICE_ROLE_KEY>"
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

export async function bootstrapAdmin(options = {}) {
  const env = loadEnv();
  const supabaseUrl = options.supabaseUrl || env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const serviceKey = options.serviceRoleKey || env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmail = (options.email || env.VITE_ADMIN_EMAIL || '').trim().toLowerCase();

  if (!supabaseUrl) {
    throw new Error('Supabase URL required. Set VITE_SUPABASE_URL in .env or pass --supabase-url.');
  }

  if (!adminEmail) {
    throw new Error('Admin email is required. Pass --email "owner@example.com" or set VITE_ADMIN_EMAIL.');
  }

  console.log(`\n--- ADMIN BOOTSTRAP WORKFLOW ---`);
  console.log(`Target Admin Email: ${adminEmail}`);

  if (!serviceKey) {
    console.log(`\n[NOTE] No SUPABASE_SERVICE_ROLE_KEY provided.`);
    console.log(`To complete admin provisioning manually in the Supabase Dashboard:`);
    console.log(`1. Navigate to: Authentication -> Users -> Add User -> Create User with email: "${adminEmail}"`);
    console.log(`2. Navigate to: SQL Editor and execute:`);
    console.log(`   INSERT INTO public.admin_users (email) VALUES ('${adminEmail}') ON CONFLICT (email) DO NOTHING;`);
    console.log(`3. Set VITE_ADMIN_EMAIL="${adminEmail}" in your admin-panel/.env file.`);
    console.log(`4. Sign in to the Admin Panel with this email and password.\n`);
    return { manualRequired: true, adminEmail };
  }

  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Insert into public.admin_users table
  console.log(`Registering "${adminEmail}" in public.admin_users...`);
  const { error: dbError } = await client
    .from('admin_users')
    .upsert({ email: adminEmail }, { onConflict: 'email' });

  if (dbError) {
    throw new Error(`Failed to insert into admin_users table: ${dbError.message}`);
  }
  console.log(`✔ Registered in public.admin_users table.`);

  // 2. Check if user already exists in auth.users
  const { data: usersData, error: listError } = await client.auth.admin.listUsers();
  if (listError) {
    console.warn(`⚠ Could not query auth.users: ${listError.message}`);
  } else {
    const existing = usersData.users.find((u) => u.email?.toLowerCase() === adminEmail);
    if (existing) {
      console.log(`✔ Supabase Auth user already exists (User ID: ${existing.id}).`);
    } else {
      console.log(`User does not exist in Auth. Creating/inviting user...`);
      if (options.password) {
        const { error: createError } = await client.auth.admin.createUser({
          email: adminEmail,
          password: options.password,
          email_confirm: true,
        });
        if (createError) console.warn(`⚠ Auth creation warning: ${createError.message}`);
        else console.log(`✔ Created Supabase Auth user with confirmed email.`);
      } else {
        console.log(`Invite link or sign up can be triggered from Supabase Dashboard or Auth page.`);
      }
    }
  }

  console.log(`✔ Admin bootstrap complete for ${adminEmail}.`);
  return { success: true, adminEmail };
}

// CLI entry point
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email') options.email = args[++i];
    if (args[i] === '--password') options.password = args[++i];
    if (args[i] === '--service-key') options.serviceRoleKey = args[++i];
    if (args[i] === '--supabase-url') options.supabaseUrl = args[++i];
  }

  bootstrapAdmin(options)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Bootstrap error:', err.message);
      process.exit(1);
    });
}
