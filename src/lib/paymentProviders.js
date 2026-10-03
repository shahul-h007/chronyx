/**
 * Master E-commerce Template - Payment Provider Boundary
 *
 * Enforces a strict conceptual and architectural separation between:
 * 1. PAYMENT METHOD (Customer selection: COD, UPI, Card, NetBanking)
 * 2. PAYMENT PROVIDER (Fulfillment engine: Offline settlement, Razorpay, or future Stripe)
 *
 * Prevents assumptions that display currency implies gateway capability.
 */

export const PAYMENT_PROVIDERS = {
  OFFLINE: {
    id: 'offline',
    name: 'Offline Settlement / COD',
    requiresCredentials: false,
    supportedCurrencies: ['*'], // All currencies supported for offline
  },
  RAZORPAY: {
    id: 'razorpay',
    name: 'Razorpay Gateway',
    requiresCredentials: true,
    credentialKeys: {
      publicKey: 'VITE_RAZORPAY_KEY_ID',
      secretKey: 'RAZORPAY_KEY_SECRET', // Edge function secret ONLY
    },
    nativeCurrency: 'INR',
    supportedCurrencies: ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD'],
    notes: 'Non-INR currencies require International Payments enablement in the Razorpay Merchant Dashboard.',
  },
  STRIPE_FUTURE: {
    id: 'stripe',
    name: 'Stripe Gateway (Provider Slot)',
    requiresCredentials: true,
    credentialKeys: {
      publicKey: 'VITE_STRIPE_PUBLISHABLE_KEY',
      secretKey: 'STRIPE_SECRET_KEY',
    },
    nativeCurrency: 'USD',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD', 'INR'],
    notes: 'Reserved abstraction slot for international multi-currency deployments.',
  },
};

export const PAYMENT_METHODS = {
  COD: {
    id: 'COD',
    name: 'Cash on Delivery',
    providerId: 'offline',
    requiresOnlineGateway: false,
  },
  UPI: {
    id: 'UPI',
    name: 'UPI Instant Pay',
    providerId: 'razorpay',
    requiresOnlineGateway: true,
    domesticOnly: true, // Specific to INR
  },
  Card: {
    id: 'Card',
    name: 'Credit or Debit Card',
    providerId: 'razorpay',
    requiresOnlineGateway: true,
    domesticOnly: false,
  },
  NetBanking: {
    id: 'NetBanking',
    name: 'Net Banking',
    providerId: 'razorpay',
    requiresOnlineGateway: true,
    domesticOnly: true,
  },
};

/**
 * Validates whether a payment provider supports the configured store currency.
 */
export function validatePaymentCurrencyCompatibility(providerId, currencyCode = 'INR') {
  const provider = Object.values(PAYMENT_PROVIDERS).find((p) => p.id === providerId);
  const code = String(currencyCode || 'INR').toUpperCase();

  if (!provider) {
    return {
      compatible: false,
      error: `Unknown payment provider "${providerId}".`,
    };
  }

  if (provider.supportedCurrencies.includes('*')) {
    return { compatible: true };
  }

  if (!provider.supportedCurrencies.includes(code)) {
    return {
      compatible: false,
      error: `Provider "${provider.name}" does not list "${code}" as a verified currency.`,
    };
  }

  // Warning when non-native currency is configured for a regional gateway
  if (provider.nativeCurrency && provider.nativeCurrency !== code) {
    return {
      compatible: true,
      warning: `Configured currency "${code}" is non-native for ${provider.name} (native: ${provider.nativeCurrency}). Ensure international payments are activated in your merchant account.`,
    };
  }

  return { compatible: true };
}

/**
 * Resolves the payment provider responsible for a given checkout method.
 */
export function getProviderForMethod(methodId) {
  const method = PAYMENT_METHODS[methodId];
  if (!method) return PAYMENT_PROVIDERS.OFFLINE;
  return Object.values(PAYMENT_PROVIDERS).find((p) => p.id === method.providerId) || PAYMENT_PROVIDERS.OFFLINE;
}

export default {
  PAYMENT_PROVIDERS,
  PAYMENT_METHODS,
  validatePaymentCurrencyCompatibility,
  getProviderForMethod,
};
