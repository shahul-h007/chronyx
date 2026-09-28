export const adminConfig = {
  storefrontUrl: typeof import.meta !== 'undefined' && import.meta.env?.VITE_STOREFRONT_URL
    ? import.meta.env.VITE_STOREFRONT_URL
    : (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL
      ? import.meta.env.VITE_SITE_URL
      : 'https://example.com'),
};

export default adminConfig;
