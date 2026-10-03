const defaultPressMentions = ['Architectural Digest', 'Wallpaper*', 'Dwell', 'Vogue Living'];

const defaultTestimonials = [
  {
    quote:
      "The teak finish perfectly complements our traditional Kerala home. It's not just a clock; it's a piece of art that anchors the living room.",
    author: 'Harikrishnan M.',
    location: 'Kochi',
  },
  {
    quote:
      "I was looking for something minimalist yet warm for my studio. The silent movement is a blessing, and the craftsmanship is exquisite.",
    author: 'Aiswarya V.',
    location: 'Trivandrum',
  },
  {
    quote:
      "Received my Chronyx piece last week. The wood grain is incredibly rich in person. Proud to see such world-class quality coming from local studios.",
    author: 'Fahad R.',
    location: 'Kozhikode',
  },
];

const defaultSocialImages = [
  'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1595526114101-10ce6b82504b?auto=format&fit=crop&q=80&w=600',
];

const PRECISION_MILLING_IMAGE =
  'https://images.unsplash.com/photo-1694532476388-afaab4a379f3?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=1000';

const replacedImageUrls = new Set([
  'https://images.unsplash.com/photo-1598425237654-4c05ab483b45?auto=format&fit=crop&q=80&w=800',
  'https://unsplash.com/photos/macro-shot-of-cnc-engraving-machine-cutting-wood-in-automated-production-workshop-with-sawdust-flakes-in-air-copy-space-3yDtj6j6wes',
]);

const defaultAboutMakingOf = [
  {
    img: 'https://images.unsplash.com/photo-1540324155974-7523202daa3f?auto=format&fit=crop&q=80&w=800',
    title: 'Sourcing the Timber',
    text: 'We work directly with sustainable lumber mills to select cuts with the most striking, unique grain patterns.',
  },
  {
    img: PRECISION_MILLING_IMAGE,
    title: 'Precision Milling',
    text: 'Each clock body is CNC milled to within a fraction of a millimeter to perfectly house our silent movement hardware.',
  },
  {
    img: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=800',
    title: 'Hand Finishing',
    text: 'The final step involves hand-sanding and applying a natural wax finish to bring out the warmth of the wood.',
  },
];

const defaultFooterLinks = {
  exploreLinks: [
    { label: 'Shop All', path: '/shop', visible: true },
    { label: 'Our Story', path: '/about', visible: true },
    { label: 'Journal', path: '/blog', visible: true },
    { label: 'Contact', path: '/contact', visible: true },
  ],
  supportLinks: [
    { label: 'Privacy & Policies', path: '/policies', visible: true },
    { label: 'Track Order', path: '/track', visible: true },
    { label: 'My Account', path: '/account', visible: true },
  ],
};

const defaultNavLinks = [
  { label: 'Home', path: '/', visible: true },
  { label: 'Shop', path: '/shop', visible: true },
  { label: 'About', path: '/about', visible: true },
  { label: 'Journal', path: '/blog', visible: true },
  { label: 'Contact', path: '/contact', visible: true },
];

export const defaultSiteContent = {
  heroText: {
    headline: 'Luxury clocks crafted like heirloom objects, not ordinary wall accessories.',
    subtext:
      'CHRONYX creates warm, sculptural timepieces for interiors that value material depth, calm presence, and considered craftsmanship.',
  },
  homepageContent: {
    heroEyebrow: 'Premium Wooden Wall Clocks',
    heroImage: '',
    signatureImage: '',
    secondaryFeatureImage: '',
    processDesignImage: '',
    processMaterialImage: '',
    processCraftImage: '',
    processFinishImage: '',
    collectionEyebrow: 'Collection',
    collectionHeadline: 'Designed for interiors that deserve a quieter, richer focal point.',
    collectionSummary:
      'Start with the full collection, open each clock on its own product page, and move through a proper cart and checkout flow only when you are ready.',
    socialEyebrow: 'Follow The Atelier',
    socialHeadline: '@chronyx.studio',
    founderQuote:
      'CHRONYX was built for people who want time to feel like part of the room, not a plastic accessory fixed to the wall.',
    trustItems: [
      {
        title: 'Insured delivery',
        body: 'White-glove packaging and tracked dispatch.',
      },
      {
        title: 'Secure payment flow',
        body: 'Shipping, payment, and confirmation all live on dedicated steps.',
      },
      {
        title: 'Small-run finishing',
        body: 'Every edition is hand-finished before dispatch.',
      },
    ],
    pressMentions: defaultPressMentions,
    testimonials: defaultTestimonials,
    socialImages: defaultSocialImages,
  },
  aboutPageContent: {
    eyebrow: 'About Us',
    title: 'The CHRONYX Story',
    introHeadline: 'Crafted like heirloom objects, not ordinary wall accessories.',
    introBody:
      'We believe that a clock is more than a functional instrument; it is the heartbeat of a room. Founded with a passion for precision woodworking and minimalist design, CHRONYX bridges the gap between traditional craftsmanship and modern aesthetics.',
    storyCards: [
      {
        title: 'Our Materials',
        body: 'We source only the finest, sustainably harvested hardwoods. From rich walnut to blonde maple, every piece is selected for its unique grain and durability.',
      },
      {
        title: 'Precision Engineering',
        body: 'Inside our handcrafted wooden frames lies a silent, sweep-movement quartz mechanism, ensuring perfect timekeeping without the distracting tick.',
      },
      {
        title: 'Limited Production',
        body: "We don't mass-produce. Every CHRONYX clock is part of a limited run, hand-finished in our studio to ensure uncompromising quality.",
      },
    ],
    makingOfEyebrow: 'Behind The Scenes',
    makingOfHeadline: 'The Art of Assembly.',
    makingOfItems: defaultAboutMakingOf,
  },
  contactPageContent: {
    eyebrow: 'Contact',
    title: 'Get in Touch',
    introHeadline: 'Send us a message',
    introBody:
      'Have questions about a product, order, or custom request? Fill out the form below and our team will get back to you within 24 hours.',
    supportHeading: 'Customer Support',
    supportBody: 'Our studio hours are Monday to Friday, 9am to 6pm IST.',
    supportEmail: 'support@chronyx.in',
    studioAddress: '124 Craft Avenue\nBangalore, 560001\nIndia',
    successTitle: 'Message Sent',
    successBody: 'Thank you for reaching out. We will be in touch shortly.',
  },
  policyContent: {
    privacy:
      'CHRONYX ("we", "our", or "us") respects your privacy. We collect minimal personal data required to process orders and improve your shopping experience. We do not sell your data to third parties. All payment information is securely processed via encrypted gateways.',
    terms:
      'By accessing and using this website, you agree to our Terms of Service. Product availability, prices, and delivery timelines are subject to change without notice. All intellectual property, including logos and imagery, belongs exclusively to CHRONYX.',
    refund:
      'We stand behind the quality of every CHRONYX piece. If you are not entirely satisfied with your purchase, you may return it within 30 days of delivery for a full refund, provided it is in original, undamaged condition with all packaging intact.\n\nCustom orders and limited edition drops are final sale and cannot be returned unless they arrive damaged or defective.',
    shipping:
      'All standard domestic orders are shipped free of charge and typically arrive within 5-7 business days. Express White-Glove shipping is available for a flat rate of INR 1,500, delivering your clock via premium courier within 1-2 business days with careful handling.\n\nYou will receive a tracking number via email as soon as your order is dispatched from our workshop.',
  },
  navContent: {
    links: defaultNavLinks,
  },
  footerContent: {
    brandCopy: 'Luxury clocks crafted like heirloom objects for rooms that appreciate quiet detail.',
    exploreHeading: 'Explore',
    supportHeading: 'Legal',
    newsletterHeading: 'Stay Updated',
    newsletterText: 'Join our waitlist for new drops and exclusive editions.',
    ...defaultFooterLinks,
  },
};

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const mergeDeep = (base, incoming) => {
  if (Array.isArray(base)) {
    return Array.isArray(incoming) && incoming.length > 0 ? incoming : base;
  }

  if (!isPlainObject(base)) {
    return incoming ?? base;
  }

  const output = { ...base };
  Object.keys(base).forEach((key) => {
    output[key] = mergeDeep(base[key], incoming?.[key]);
  });

  if (isPlainObject(incoming)) {
    Object.keys(incoming).forEach((key) => {
      if (!(key in output)) output[key] = incoming[key];
    });
  }

  return output;
};

const normalizeContentImages = (value) => {
  if (typeof value === 'string') {
    return replacedImageUrls.has(value) ? PRECISION_MILLING_IMAGE : value;
  }

  if (Array.isArray(value)) {
    return value.map(normalizeContentImages);
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, normalizeContentImages(entry)]),
    );
  }

  return value;
};

export function buildSiteContent(settingsRows = []) {
  const byKey = Object.fromEntries((settingsRows || []).map((row) => [row.key, row.value]));

  return normalizeContentImages({
    heroText: mergeDeep(defaultSiteContent.heroText, byKey.hero_text),
    homepageContent: mergeDeep(defaultSiteContent.homepageContent, byKey.homepage_content),
    aboutPageContent: mergeDeep(defaultSiteContent.aboutPageContent, byKey.about_page_content),
    contactPageContent: mergeDeep(defaultSiteContent.contactPageContent, byKey.contact_page_content),
    policyContent: mergeDeep(defaultSiteContent.policyContent, byKey.store_policies),
    navContent: mergeDeep(defaultSiteContent.navContent, byKey.navigation_content),
    footerContent: mergeDeep(defaultSiteContent.footerContent, byKey.footer_content),
  });
}

export function toBoolean(value, defaultValue = false) {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true;
    if (s === 'false' || s === '0' || s === 'no' || s === 'off') return false;
  }
  if (typeof value === 'number') return value !== 0;
  return Boolean(value);
}

export function isJournalPath(path) {
  const cleanPath = String(path || '').trim();
  return cleanPath === '/blog' || cleanPath === '/journal' || cleanPath.startsWith('/journal/');
}

