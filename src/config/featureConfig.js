/**
 * Master E-commerce Template - Capability & Feature System
 * Controls which optional capabilities are active in the storefront and admin.
 * Core commerce capabilities (products, collections, cart, checkout, orders, cms, seo) are always enabled.
 */

const parseEnvBoolean = (key, defaultValue) => {
  if (typeof import.meta === 'undefined' || !import.meta.env) return defaultValue;
  const val = import.meta.env[key];
  if (val === undefined || val === null) return defaultValue;
  const lower = String(val).trim().toLowerCase();
  return lower === 'true' || lower === '1' || lower === 'yes';
};

export const defaultFeatures = {
  // Core optional modules
  coupons: parseEnvBoolean('VITE_FEATURE_COUPONS', true),
  reviews: parseEnvBoolean('VITE_FEATURE_REVIEWS', true),
  wishlist: parseEnvBoolean('VITE_FEATURE_WISHLIST', true),
  productVerification: parseEnvBoolean('VITE_FEATURE_PRODUCT_VERIFICATION', true),
  certificates: parseEnvBoolean('VITE_FEATURE_CERTIFICATES', true),
  placementGuide: parseEnvBoolean('VITE_FEATURE_PLACEMENT_GUIDE', true),
  locationPages: parseEnvBoolean('VITE_FEATURE_LOCATION_PAGES', true),
  productVideo: parseEnvBoolean('VITE_FEATURE_PRODUCT_VIDEO', true),
  exitIntentPopup: parseEnvBoolean('VITE_FEATURE_EXIT_INTENT', true),
  whatsappWidget: parseEnvBoolean('VITE_FEATURE_WHATSAPP_WIDGET', true),
};

/**
 * Backward-compatible featureConfig object providing direct property access.
 */
export const featureConfig = {
  ...defaultFeatures,
};

/**
 * Determines whether a capability is enabled.
 * For 'journal', inspects storeSettings.show_journal (master availability switch).
 * For all other capabilities, checks defaultFeatures or optional overrides.
 */
export function isCapabilityEnabled(capabilityName, storeSettings = null) {
  if (capabilityName === 'journal') {
    if (!storeSettings) return false;
    const val = storeSettings.show_journal;
    return val === true || val === 'true' || val === 1;
  }

  if (capabilityName in defaultFeatures) {
    return Boolean(defaultFeatures[capabilityName]);
  }

  // Core features are always enabled
  const coreFeatures = ['products', 'collections', 'cart', 'checkout', 'orders', 'navigation', 'cms', 'seo'];
  if (coreFeatures.includes(capabilityName)) {
    return true;
  }

  return false;
}

export default featureConfig;
