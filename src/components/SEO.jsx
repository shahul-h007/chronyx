import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { siteConfig } from '../config/siteConfig';

let cachedOverrides = null;

const DEFAULT_TITLE = `${siteConfig.name} | Luxury Wooden Wall Clocks`;
const DEFAULT_DESCRIPTION =
  'Precision-crafted wooden wall clocks blending modern minimalist design with timeless materials.';
const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&q=80&w=1200&h=630';
const SITE_URL = import.meta.env.VITE_SITE_URL || siteConfig.domain;

const upsertMeta = (selector, attributes) => {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement('meta');
    Object.entries(attributes).forEach(([key, value]) => {
      if (key !== 'content') {
        element.setAttribute(key, value);
      }
    });
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
};

const upsertLink = (selector, rel, href) => {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
};

export default function SEO({ title, description, schema, image, path, noindex }) {
  const [dbOverride, setDbOverride] = useState(null);
  const cleanPath = path || window.location.pathname;

  useEffect(() => {
    if (cachedOverrides) {
      setDbOverride(cachedOverrides.find(o => o.path === cleanPath));
    } else {
      supabase.from('seo_overrides').select('*').then(({ data }) => {
        if (data && !data.error) {
          cachedOverrides = data;
          setDbOverride(data.find(o => o.path === cleanPath));
        }
      });
    }
  }, [cleanPath]);

  useEffect(() => {
    const pageTitle = dbOverride?.title || (title ? `${title} | ${siteConfig.name}` : DEFAULT_TITLE);
    const pageDescription = dbOverride?.description || description || DEFAULT_DESCRIPTION;
    const pageImage = dbOverride?.image || image || DEFAULT_IMAGE;
    
    // Clean canonical URL without query parameters
    const cleanPath = path || window.location.pathname;
    const pageUrl = `${SITE_URL}${cleanPath}`;

    document.title = pageTitle;

    upsertMeta('meta[name="description"]', {
      name: 'description',
      content: pageDescription,
    });

    if (noindex) {
      upsertMeta('meta[name="robots"]', {
        name: 'robots',
        content: 'noindex, follow',
      });
    } else {
      let element = document.head.querySelector('meta[name="robots"]');
      if (element) element.remove();
    }

    upsertMeta('meta[property="og:title"]', {
      property: 'og:title',
      content: pageTitle,
    });
    upsertMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: pageDescription,
    });
    upsertMeta('meta[property="og:image"]', {
      property: 'og:image',
      content: pageImage,
    });
    upsertMeta('meta[property="og:url"]', {
      property: 'og:url',
      content: pageUrl,
    });
    upsertMeta('meta[property="og:type"]', {
      property: 'og:type',
      content: 'website',
    });

    upsertMeta('meta[name="twitter:card"]', {
      name: 'twitter:card',
      content: 'summary_large_image',
    });
    upsertMeta('meta[name="twitter:title"]', {
      name: 'twitter:title',
      content: pageTitle,
    });
    upsertMeta('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: pageDescription,
    });
    upsertMeta('meta[name="twitter:image"]', {
      name: 'twitter:image',
      content: pageImage,
    });

    upsertLink('link[rel="canonical"]', 'canonical', pageUrl);

    document
      .querySelectorAll('[id^="schema-markup-route-"]')
      .forEach((node) => node.remove());

    const schemas = Array.isArray(schema) ? schema.filter(Boolean) : schema ? [schema] : [];
    schemas.forEach((entry, index) => {
      const script = document.createElement('script');
      script.id = `schema-markup-route-${index}`;
      script.type = 'application/ld+json';
      script.text = JSON.stringify(entry);
      document.head.appendChild(script);
    });

    return () => {
      document
        .querySelectorAll('[id^="schema-markup-route-"]')
        .forEach((node) => node.remove());
    };
  }, [title, description, schema, image, path, noindex, dbOverride]);

  return null;
}
