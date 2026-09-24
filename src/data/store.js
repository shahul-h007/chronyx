import { siteConfig } from '../config/siteConfig';

export const CART_KEY = siteConfig.storage.cartKey;
export const ORDER_KEY = 'chronyx-orders';

export const homeHighlights = [
  {
    title: 'Furniture-grade materials',
    body: 'Walnut, maple, and teak selected with the same care as premium interior joinery.',
  },
  {
    title: 'Quiet movement standard',
    body: 'Silent sweep hardware keeps bedrooms, studios, and lounges free from mechanical noise.',
  },
  {
    title: 'Small-run finishing',
    body: 'Each edition is hand-finished for grain consistency, edge sharpness, and brass tone.',
  },
];

export const founderQuote =
  'CHRONYX was built for people who want time to feel like part of the room, not a plastic accessory fixed to the wall.';

export const initialShipping = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  pincode: '',
};

export const initialPayment = {
  method: 'Card',
  cardName: '',
  cardNumber: '',
  expiry: '',
  cvv: '',
  upi: '',
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

export const loadCart = () => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = JSON.parse(window.localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};
