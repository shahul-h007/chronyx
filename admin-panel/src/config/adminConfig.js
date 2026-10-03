/**
 * Master E-commerce Template - Admin Configuration
 * Provides business identity, storefront URL, localization, and document defaults for the Admin Panel.
 */

export const adminConfig = {
  storeName: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STORE_NAME) || 'Store',
  adminLabel: 'Admin Portal',
  tagline: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STORE_TAGLINE) || 'Master E-commerce Template',
  storefrontUrl: typeof import.meta !== 'undefined' && import.meta.env?.VITE_STOREFRONT_URL
    ? import.meta.env.VITE_STOREFRONT_URL
    : (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL
      ? import.meta.env.VITE_SITE_URL
      : 'https://example.com'),

  contact: {
    email: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CONTACT_EMAIL) || 'hello@example.com',
    supportEmail: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPPORT_EMAIL) || 'support@example.com',
    phone: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CONTACT_PHONE) || '',
    whatsapp: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WHATSAPP_NUMBER) || '',
    address: {
      street: '124 Craft Avenue',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
      formatted: '124 Craft Avenue, Bangalore, Karnataka - 560001, India',
    },
  },

  localization: {
    currencyCode: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CURRENCY_CODE) || 'INR',
    currencySymbol: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CURRENCY_SYMBOL) || '₹',
    locale: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_LOCALE) || 'en-IN',
    maximumFractionDigits: typeof import.meta !== 'undefined' && import.meta.env?.VITE_CURRENCY_FRACTION_DIGITS !== undefined
      ? Number(import.meta.env.VITE_CURRENCY_FRACTION_DIGITS)
      : 0,
  },
};

/**
 * Format currency amounts for admin reporting and order displays.
 */
export function formatCurrency(amount, config = adminConfig.localization) {
  const num = Number(amount || 0);
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currencyCode,
      maximumFractionDigits: config.maximumFractionDigits,
    }).format(num);
  } catch {
    return `${config.currencySymbol}${Math.round(num).toLocaleString(config.locale)}`;
  }
}

/**
 * Merges admin static config with dynamic store_settings.
 */
export function getMergedAdminConfig(storeSettings = {}) {
  if (!storeSettings || typeof storeSettings !== 'object') {
    return adminConfig;
  }

  return {
    ...adminConfig,
    storeName: storeSettings.store_name || adminConfig.storeName,
    contact: {
      ...adminConfig.contact,
      email: storeSettings.contact_email || adminConfig.contact.email,
      supportEmail: storeSettings.contact_email || adminConfig.contact.supportEmail,
      phone: storeSettings.whatsapp_number || adminConfig.contact.phone,
      whatsapp: storeSettings.whatsapp_number || adminConfig.contact.whatsapp,
    },
    localization: {
      ...adminConfig.localization,
      currencyCode: storeSettings.currency_code || adminConfig.localization.currencyCode,
      currencySymbol: storeSettings.currency_symbol || adminConfig.localization.currencySymbol,
      locale: storeSettings.locale || adminConfig.localization.locale,
      maximumFractionDigits: storeSettings.currency_fraction_digits !== undefined
        ? Number(storeSettings.currency_fraction_digits)
        : adminConfig.localization.maximumFractionDigits,
    },
  };
}

export default adminConfig;
