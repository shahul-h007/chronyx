/**
 * Master E-commerce Template - Store Business Configuration
 * Defines store identity, contact details, social links, localization, and commerce defaults.
 * Can be overridden via environment variables or augmented dynamically with DB store_settings.
 */

export const siteConfig = {
  name: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STORE_NAME) || 'CHRONYX',
  tagline: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STORE_TAGLINE) || 'Handcrafted Wooden Timepieces',
  legalName: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STORE_LEGAL_NAME) || 'Chronyx Atelier Private Limited',
  domain: typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL
    ? import.meta.env.VITE_SITE_URL
    : 'https://chronyx.in',

  branding: {
    logo: '/brand/logo-full.png',
    mark: '/brand/mark.png',
    favicon: '/brand/favicon.png',
    appleTouchIcon: '/brand/apple-touch-icon.png',
  },

  contact: {
    email: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CONTACT_EMAIL) || 'hello@chronyx.in',
    supportEmail: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPPORT_EMAIL) || 'support@chronyx.in',
    phone: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CONTACT_PHONE) || '+91 9562122618',
    whatsapp: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WHATSAPP_NUMBER) || '919562122618',
    address: {
      street: '124 Craft Avenue',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
      formatted: '124 Craft Avenue, Bangalore, Karnataka - 560001, India',
    },
  },
  contactEmail: 'hello@chronyx.in',

  social: {
    instagram: 'https://instagram.com/chronyx.studio',
    facebook: '',
    youtube: '',
    twitter: '',
  },

  localization: {
    currencyCode: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CURRENCY_CODE) || 'INR',
    currencySymbol: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CURRENCY_SYMBOL) || '₹',
    locale: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_LOCALE) || 'en-IN',
    maximumFractionDigits: typeof import.meta !== 'undefined' && import.meta.env?.VITE_CURRENCY_FRACTION_DIGITS !== undefined
      ? Number(import.meta.env.VITE_CURRENCY_FRACTION_DIGITS)
      : 0,
    symbolPosition: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CURRENCY_SYMBOL_POSITION) || 'before', // 'before' | 'after'
  },

  commerce: {
    freeShippingThreshold: 50000,
    expressShippingFee: 1500,
    codFee: 100,
    defaultShippingFee: 0,
  },

  storage: {
    cartKey: 'chronyx-cart',
    wishlistKey: 'chronyx-wishlist',
    orderKey: 'chronyx-orders',
  },
};

/**
 * Merges static business configuration with dynamic store_settings fetched from Supabase.
 * This guarantees a single source of truth without overriding static assets or routes.
 */
export function getMergedSiteConfig(storeSettings = {}) {
  if (!storeSettings || typeof storeSettings !== 'object') {
    return siteConfig;
  }

  return {
    ...siteConfig,
    name: storeSettings.store_name || siteConfig.name,
    contact: {
      ...siteConfig.contact,
      email: storeSettings.contact_email || siteConfig.contact.email,
      supportEmail: storeSettings.contact_email || siteConfig.contact.supportEmail,
      phone: storeSettings.whatsapp_number || siteConfig.contact.phone,
      whatsapp: storeSettings.whatsapp_number || siteConfig.contact.whatsapp,
    },
    commerce: {
      ...siteConfig.commerce,
      freeShippingThreshold: Number(storeSettings.free_shipping_threshold ?? siteConfig.commerce.freeShippingThreshold),
      expressShippingFee: Number(storeSettings.express_shipping_fee ?? siteConfig.commerce.expressShippingFee),
      codFee: Number(storeSettings.cod_fee ?? siteConfig.commerce.codFee),
    },
    localization: {
      ...siteConfig.localization,
      currencyCode: storeSettings.currency_code || siteConfig.localization.currencyCode,
      currencySymbol: storeSettings.currency_symbol || siteConfig.localization.currencySymbol,
      locale: storeSettings.locale || siteConfig.localization.locale,
      maximumFractionDigits: storeSettings.currency_fraction_digits !== undefined
        ? Number(storeSettings.currency_fraction_digits)
        : siteConfig.localization.maximumFractionDigits,
    },
  };
}

export default siteConfig;
