/**
 * Master E-commerce Template - Version Manifest
 *
 * Defines the core engine release version, compatibility matrix, and upgrade identifiers.
 * This decouples the upstream template engine version from individual client configuration and data.
 */

export const TEMPLATE_VERSION = '1.0.0';

export const TEMPLATE_MANIFEST = {
  version: TEMPLATE_VERSION,
  codename: 'Foundation Hardened',
  releaseDate: '2026-10-02',
  engine: 'Master E-commerce Template Engine',
  compatibility: {
    minNodeVersion: '>=18.0.0',
    viteVersion: '^8.0.0',
    reactVersion: '^18.3.0',
    supabaseJsVersion: '^2.100.0',
  },
  supportedThemes: ['chronyx', 'minimal', 'warmEditorial'],
  supportedCapabilities: [
    'cart',
    'checkout',
    'coupons',
    'reviews',
    'wishlist',
    'journal',
    'productVerification',
    'certificates',
    'placementGuide',
    'locationPages',
    'productVideo',
    'exitIntentPopup',
    'whatsappWidget',
  ],
  paymentProviders: ['offline', 'razorpay'],
};

export default TEMPLATE_MANIFEST;
