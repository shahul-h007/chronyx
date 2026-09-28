import { siteConfig } from '../config/siteConfig';

const ENV = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

export const SITE_URL = ENV.VITE_SITE_URL || siteConfig.domain;
export const SITE_NAME = siteConfig.name;
export const DEFAULT_SOCIAL_IMAGE =
  'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&q=80&w=1200&h=630';

const YOUTUBE_WATCH_REGEX =
  /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([^?&/]+)/i;
const VIMEO_REGEX = /vimeo\.com\/(?:video\/)?(\d+)/i;

export function buildAbsoluteUrl(path = '/') {
  try {
    return new URL(path, SITE_URL).toString();
  } catch {
    return `${SITE_URL}${path}`;
  }
}

export function stripHtml(value = '') {
  return String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function secondsToIsoDuration(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds || 0));
  if (!seconds) return null;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const time = [hours ? `${hours}H` : '', minutes ? `${minutes}M` : '', remainingSeconds ? `${remainingSeconds}S` : '']
    .filter(Boolean)
    .join('');

  return `PT${time || '0S'}`;
}

export function normalizeIsoDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export function getYoutubeVideoId(value = '') {
  return value.match(YOUTUBE_WATCH_REGEX)?.[1] || null;
}

export function getVimeoVideoId(value = '') {
  return value.match(VIMEO_REGEX)?.[1] || null;
}

export function normalizeEmbedUrl(value = '') {
  if (!value) return null;

  if (value.includes('/embed/')) return value;

  const youtubeId = getYoutubeVideoId(value);
  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}`;
  }

  const vimeoId = getVimeoVideoId(value);
  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}`;
  }

  return value;
}

export function getVideoThumbnail({ thumbnailUrl, embedUrl, fallbackImage }) {
  if (thumbnailUrl) return thumbnailUrl;

  const youtubeId = getYoutubeVideoId(embedUrl || '');
  if (youtubeId) {
    return `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`;
  }

  return fallbackImage || DEFAULT_SOCIAL_IMAGE;
}

export function hasVideoAsset(product = {}) {
  return Boolean(product?.video_url || product?.video_embed_url || product?.videoEmbed);
}

export function buildProductVideoAsset(product = {}) {
  if (!hasVideoAsset(product)) return null;

  const embedUrl = normalizeEmbedUrl(product.video_embed_url || product.videoEmbed || '');
  const contentUrl = product.video_url || null;
  const thumbnailUrl = getVideoThumbnail({
    thumbnailUrl: product.video_thumbnail_url,
    embedUrl,
    fallbackImage: product.hero,
  });
  const uploadDate = normalizeIsoDate(product.video_upload_date || product.created_at);
  const durationSeconds = Number(product.video_duration_seconds || 0) || null;
  const transcript = stripHtml(product.video_transcript || '');
  const title = product.video_title || `${product.name} video`;
  const description = stripHtml(
    product.video_description || product.story || product.summary || `${product.name} by ${SITE_NAME}.`,
  );

  return {
    title,
    description,
    contentUrl,
    embedUrl,
    thumbnailUrl,
    uploadDate,
    durationSeconds,
    durationIso: secondsToIsoDuration(durationSeconds),
    transcript,
    captionUrl: product.video_srt_url || null,
    viewCount: Number(product.video_view_count || 0) || null,
    pageUrl: buildAbsoluteUrl(`/products/${product.id}`),
  };
}

export function buildProductSchema(product, reviewStats) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: (product.gallery || []).filter(Boolean),
    description: stripHtml(product.summary || product.story || ''),
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    offers: {
      '@type': 'Offer',
      url: buildAbsoluteUrl(`/products/${product.id}`),
      priceCurrency: 'INR',
      price: product.price,
      availability:
        product.stockQuantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
  };

  if (reviewStats?.count > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(reviewStats.avg),
      reviewCount: reviewStats.count,
    };
  }

  return schema;
}

export function buildBreadcrumbSchema(items = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: buildAbsoluteUrl(item.path),
    })),
  };
}

export function buildVideoObjectSchema(video, product) {
  if (!video) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.description,
    thumbnailUrl: [video.thumbnailUrl],
    uploadDate: video.uploadDate,
    embedUrl: video.embedUrl || undefined,
    contentUrl: video.contentUrl || undefined,
    duration: video.durationIso || undefined,
    transcript: video.transcript || undefined,
    isFamilyFriendly: true,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntityOfPage: buildAbsoluteUrl(`/products/${product.id}`),
  };

  if (video.viewCount) {
    schema.interactionStatistic = {
      '@type': 'InteractionCounter',
      interactionType: {
        '@type': 'WatchAction',
      },
      userInteractionCount: video.viewCount,
    };
  }

  return schema;
}

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: buildAbsoluteUrl(siteConfig.branding.logo),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: siteConfig.contact?.supportEmail || siteConfig.contactEmail,
      areaServed: 'IN',
      availableLanguage: ['en', 'hi'],
    },
  };
}

export function buildWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${buildAbsoluteUrl('/shop')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildVideoSitemapXml(products = []) {
  const videoEntries = products
    .map((product) => ({
      product,
      video: buildProductVideoAsset(product),
    }))
    .filter((entry) => entry.video);

  const urls = videoEntries
    .map(({ product, video }) => {
      const playerLoc = video.embedUrl || video.contentUrl;
      const contentLoc = video.contentUrl;
      const published = video.uploadDate || normalizeIsoDate(product.created_at);

      return `  <url>
    <loc>${escapeXml(video.pageUrl)}</loc>
    <video:video>
      <video:thumbnail_loc>${escapeXml(video.thumbnailUrl)}</video:thumbnail_loc>
      <video:title>${escapeXml(video.title)}</video:title>
      <video:description>${escapeXml(video.description)}</video:description>
${contentLoc ? `      <video:content_loc>${escapeXml(contentLoc)}</video:content_loc>\n` : ''}${playerLoc ? `      <video:player_loc>${escapeXml(playerLoc)}</video:player_loc>\n` : ''}${video.durationSeconds ? `      <video:duration>${Math.floor(video.durationSeconds)}</video:duration>\n` : ''}${published ? `      <video:publication_date>${escapeXml(published)}</video:publication_date>\n` : ''}      <video:family_friendly>yes</video:family_friendly>
${video.viewCount ? `      <video:view_count>${Math.floor(video.viewCount)}</video:view_count>\n` : ''}    </video:video>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls}
</urlset>
`;
}
export function buildArticleSchema(article) {
  if (!article) return null;
  const siteUrl = SITE_URL;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.seo_title || article.title,
    description: article.seo_description || article.excerpt,
    image: article.cover_image ? [article.cover_image] : [],
    datePublished: article.published_at ? new Date(article.published_at).toISOString() : new Date().toISOString(),
    dateModified: article.updated_at ? new Date(article.updated_at).toISOString() : new Date().toISOString(),
    author: [{
      '@type': 'Organization',
      name: SITE_NAME,
      url: siteUrl
    }],
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: buildAbsoluteUrl(siteConfig.branding.logo)
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/journal/${article.slug}`
    }
  };
}
