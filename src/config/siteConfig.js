export const siteConfig = {
  name: 'CHRONYX',
  domain: typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL
    ? import.meta.env.VITE_SITE_URL
    : 'https://chronyx.in',
  branding: {
    logo: '/brand/chronyx-logo-full.png',
    mark: '/brand/chronyx-mark-gold.png',
    favicon: '/brand/favicon-512.png',
    appleTouchIcon: '/brand/apple-touch-icon.png',
  },
  contact: {
    email: 'hello@chronyx.in',
    supportEmail: 'support@chronyx.in',
  },
  contactEmail: 'hello@chronyx.in',
  storage: {
    wishlistKey: 'chronyx-wishlist',
    cartKey: 'chronyx-cart',
  },
};

export default siteConfig;
