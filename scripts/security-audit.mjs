import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function has(path) {
  return existsSync(join(root, path));
}

function trackedFiles() {
  try {
    return execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    return [];
  }
}

const findings = [];

function fail(id, severity, message, paths) {
  findings.push({ id, severity, message, paths });
}

const paymentPage = read('src/pages/PaymentPage.jsx');
if (
  paymentPage.includes("status: payment.method === 'COD' ? 'pending' : 'paid'") &&
  paymentPage.includes('handler: function (response)') &&
  !paymentPage.includes('razorpay_signature')
) {
  fail(
    'SEC-001',
    'critical',
    'Paid orders are created from the Razorpay browser callback without visible signature verification.',
    ['src/pages/PaymentPage.jsx'],
  );
}

const rls = read('rls_policies.sql');
if (/TO authenticated[\s\S]{0,120}USING \(true\)/.test(rls)) {
  fail(
    'SEC-002',
    'high',
    'RLS policies grant broad admin-like access to any authenticated user.',
    ['rls_policies.sql'],
  );
}

const authenticity = read('authenticity_units_schema.sql');
if (
  /Public can read product authenticity units/.test(authenticity) &&
  /for select[\s\S]{0,80}using \(true\)/i.test(authenticity) &&
  /authenticity_code text not null unique/.test(authenticity)
) {
  fail(
    'SEC-003',
    'high',
    'Public authenticity-unit reads can expose secret verification codes.',
    ['authenticity_units_schema.sql'],
  );
}

const marketingFunction = read('supabase/functions/send-marketing-email/index.ts');
if (
  marketingFunction.includes('SUPABASE_SERVICE_ROLE_KEY') &&
  !/auth\.getUser|getUser\(/.test(marketingFunction)
) {
  fail(
    'SEC-004',
    'high',
    'Marketing email function uses service role access without visible server-side admin authorization.',
    ['supabase/functions/send-marketing-email/index.ts'],
  );
}

if (/<h1[^>]*>\$\{subject\}<\/h1>/.test(marketingFunction) || /\$\{line\}/.test(marketingFunction)) {
  fail(
    'SEC-004B',
    'medium',
    'Marketing email HTML interpolates request-controlled content without escaping.',
    ['supabase/functions/send-marketing-email/index.ts'],
  );
}

const journalArticle = read('src/pages/JournalArticlePage.jsx');
if (journalArticle.includes('dangerouslySetInnerHTML') && !/DOMPurify|sanitize/i.test(journalArticle)) {
  fail(
    'SEC-005',
    'medium',
    'Journal article HTML is rendered without visible sanitization.',
    ['src/pages/JournalArticlePage.jsx'],
  );
}

const vercel = has('vercel.json') ? read('vercel.json') : '';
for (const header of ['Content-Security-Policy', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy']) {
  if (!vercel.includes(header)) {
    fail('SEC-006', 'medium', `Missing production security header: ${header}.`, ['vercel.json']);
  }
}

const tracked = trackedFiles();
for (const envFile of ['.env', '.env.local', '.env.production']) {
  if (tracked.includes(envFile)) {
    fail('SEC-007', 'high', `${envFile} is tracked by git and may expose environment values.`, [envFile]);
  }
}

const secretPatterns = [
  /\b(SUPABASE_SERVICE_ROLE_KEY|RAZORPAY_KEY_SECRET|RESEND_API_KEY|OPENAI_API_KEY)\s*=\s*([^\s`'"]+)/g,
];
for (const file of tracked) {
  if (file.includes('node_modules/') || file.includes('dist/')) continue;
  if (!/\.(js|jsx|ts|tsx|mjs|cjs|json|sql|md|html|env|txt)$/i.test(file)) continue;
  const text = read(file);
  const hasSecretLikeAssignment = secretPatterns.some((pattern) => {
    pattern.lastIndex = 0;
    return Array.from(text.matchAll(pattern)).some((match) => {
      const value = match[2].trim().toLowerCase();
      return value && !value.startsWith('your_') && !value.includes('placeholder') && value !== 'xxxx';
    });
  });
  if (hasSecretLikeAssignment) {
    fail('SEC-008', 'high', 'Tracked file contains a secret-like environment assignment.', [file]);
  }
}

if (!findings.length) {
  console.log('Security audit passed: no checked findings detected.');
  process.exit(0);
}

console.error(`Security audit failed: ${findings.length} finding(s) detected.\n`);
for (const finding of findings) {
  console.error(`[${finding.severity.toUpperCase()}] ${finding.id}: ${finding.message}`);
  console.error(`  Files: ${finding.paths.join(', ')}`);
}
console.error('\nSee docs/security/security_best_practices_report.md for impact and recommended fixes.');
process.exit(1);
