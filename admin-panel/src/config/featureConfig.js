/**
 * Master E-commerce Template - Admin Capability & Feature System
 */

const parseEnvBoolean = (key, defaultValue) => {
  if (typeof import.meta === 'undefined' || !import.meta.env) return defaultValue;
  const val = import.meta.env[key];
  if (val === undefined || val === null) return defaultValue;
  const lower = String(val).trim().toLowerCase();
  return lower === 'true' || lower === '1' || lower === 'yes';
};

export const defaultFeatures = {
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

export const featureConfig = {
  ...defaultFeatures,
};

export function isCapabilityEnabled(capabilityName, storeSettings = null) {
  if (capabilityName === 'journal') {
    if (!storeSettings) return false;
    const val = storeSettings.show_journal;
    return val === true || val === 'true' || val === 1;
  }

  if (capabilityName in defaultFeatures) {
    return Boolean(defaultFeatures[capabilityName]);
  }

  return true;
}

export default featureConfig;
