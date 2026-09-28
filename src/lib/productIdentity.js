import { siteConfig } from '../config/siteConfig';

function sanitizeSeed(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function buildNameSeed(name) {
  return sanitizeSeed(name).slice(0, 4) || 'CHRX';
}

function buildRandomSeed() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '').toUpperCase();
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .padEnd(16, 'X')
    .slice(0, 16);
}

export function buildPublicProductId(productId) {
  const compact = sanitizeSeed(productId).slice(0, 10) || 'PENDING0000';
  return `CHX-${compact}`;
}

export function createAuthenticityUnit(product, serialNumber) {
  const randomSeed = buildRandomSeed();
  const nameSeed = buildNameSeed(product?.name);
  const serial = String(serialNumber || 1).padStart(4, '0');

  return {
    serial_number: Number(serialNumber || 1),
    public_unit_id: `CHXU-${nameSeed}-${serial}-${randomSeed.slice(0, 4)}`,
    authenticity_code: `AUTH-${randomSeed.slice(4, 8)}-${randomSeed.slice(8, 12)}-${randomSeed.slice(12, 16)}`,
    status: 'available',
  };
}

export function buildUnitVerificationPath(unit) {
  const code = unit?.authenticity_code || '';
  return `/verify/unit/${unit?.public_unit_id || ''}?code=${encodeURIComponent(code)}`;
}

export function buildUnitVerificationUrl(unit, origin) {
  const fallbackOrigin = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL
    ? import.meta.env.VITE_SITE_URL
    : (siteConfig?.domain || 'https://example.com');
  return `${origin || fallbackOrigin}${buildUnitVerificationPath(unit)}`;
}

export function buildUnitQrCodeUrl(unit, origin) {
  const verificationUrl = buildUnitVerificationUrl(unit, origin);
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=0&data=${encodeURIComponent(
    verificationUrl,
  )}`;
}
