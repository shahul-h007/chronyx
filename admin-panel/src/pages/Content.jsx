import { useEffect, useState } from 'react';
import {
  FloppyDisk,
  Spinner,
  UploadSimple,
  CheckCircle,
  WarningCircle,
  X,
  House,
  BookOpen,
  ShieldCheck,
  Article,
  ChatCircleText,
  FileText,
} from '@phosphor-icons/react';
import { supabase } from '../lib/supabase';
import AdminPageHeader from '../components/common/AdminPageHeader';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import FormField from '../components/common/FormField';

const defaultHero = {
  headline: '',
  subtext: '',
};

const defaultPolicies = {
  privacy: '',
  terms: '',
  refund: '',
  shipping: '',
};

const defaultHomepage = {
  heroEyebrow: 'Premium Wooden Wall Clocks',
  heroImage: '',
  signatureImage: '',
  secondaryFeatureImage: '',
  processDesignImage: '',
  processMaterialImage: '',
  processCraftImage: '',
  processFinishImage: '',
  collectionEyebrow: 'Collection',
  collectionHeadline: '',
  collectionSummary: '',
  socialEyebrow: 'Follow The Atelier',
  socialHeadline: '@chronyx.studio',
  founderQuote: '',
  trustItemsText: '',
  pressMentionsText: '',
  testimonialsText: '',
  socialImagesText: '',
};

const defaultAbout = {
  eyebrow: 'About Us',
  title: 'The CHRONYX Story',
  introHeadline: '',
  introBody: '',
  storyCardsText: '',
  makingOfEyebrow: 'Behind The Scenes',
  makingOfHeadline: 'The Art of Assembly.',
  makingOfItemsText: '',
};

const defaultContact = {
  eyebrow: 'Contact',
  title: 'Get in Touch',
  introHeadline: 'Send us a message',
  introBody: '',
  supportHeading: 'Customer Support',
  supportBody: '',
  supportEmail: 'support@chronyx.in',
  studioAddress: '',
  successTitle: 'Message Sent',
  successBody: '',
};

const defaultFooter = {
  brandCopy: '',
  exploreHeading: 'Explore',
  exploreLinksText: 'Shop All|/shop\nOur Story|/about\nJournal|/blog\nContact|/contact',
  supportHeading: 'Legal',
  supportLinksText: 'Privacy & Policies|/policies\nTrack Order|/track\nMy Account|/account',
  newsletterHeading: 'Stay Updated',
  newsletterText: '',
};

const joinLines = (items = [], formatter) => items.map(formatter).join('\n');

const parseSimpleLines = (value) =>
  String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const parsePipeLines = (value, keys) =>
  parseSimpleLines(value)
    .map((line) => line.split('|').map((part) => part.trim()))
    .filter((parts) => parts.length >= keys.length && parts.every(Boolean))
    .map((parts) =>
      keys.reduce((acc, key, index) => {
        acc[key] = parts[index] || '';
        return acc;
      }, {})
    );

const sections = [
  { id: 'hero', label: 'Hero Banner', icon: House },
  { id: 'homepage', label: 'Homepage Curation', icon: Article },
  { id: 'about', label: 'About Brand Story', icon: BookOpen },
  { id: 'contact', label: 'Contact & Support', icon: ChatCircleText },
  { id: 'policies', label: 'Legal Policies', icon: ShieldCheck },
  { id: 'footer', label: 'Footer & Navigation', icon: FileText },
];

const getSectionStatus = (count, total) => {
  if (count === total) return { label: 'Ready', tone: 'success' };
  if (count === 0) return { label: 'Empty', tone: 'neutral' };
  return { label: 'In Progress', tone: 'warning' };
};

function SectionHeader({ title, body }) {
  return (
    <div style={{ marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid var(--admin-border)' }}>
      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--admin-text)', margin: '0 0 4px' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--admin-text-muted)', lineHeight: 1.5 }}>{body}</p>
    </div>
  );
}

function PreviewNote({ title, children }) {
  return (
    <div
      style={{
        padding: '14px 16px',
        border: '1px solid var(--admin-border)',
        borderRadius: 'var(--admin-radius-md, 8px)',
        background: 'var(--admin-surface-hover)',
      }}
    >
      <div
        style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--admin-text-muted)',
          marginBottom: '8px',
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: '0.88rem', color: 'var(--admin-text)', lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

function ImageSlotField({ label, hint, value, previewValue, onChange, onError }) {
  const [isUploading, setIsUploading] = useState(false);
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!cloudName || !uploadPreset) {
      onError?.('Cloudinary upload is not configured in the admin panel environment.');
      event.target.value = '';
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload image');
      const data = await response.json();
      onChange(data.secure_url);
    } catch (error) {
      console.error('Homepage image upload error:', error);
      onError?.('Failed to upload homepage image. Please try again.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div style={{ display: 'grid', gap: '10px' }}>
      <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--admin-text)' }}>{label}</label>

      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid var(--admin-border)',
          borderRadius: 'var(--admin-radius-md, 8px)',
          background: 'var(--admin-surface-hover)',
          minHeight: '180px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {previewValue ? (
          <>
            <img
              src={previewValue}
              alt={label}
              style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
            />
            <span
              style={{
                position: 'absolute',
                left: '10px',
                top: '10px',
                padding: '4px 8px',
                borderRadius: '999px',
                background: 'rgba(15, 23, 42, 0.85)',
                color: '#fff',
                fontSize: '0.72rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}
            >
              {value ? 'Custom image' : 'Live fallback'}
            </span>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>
            <UploadSimple size={24} style={{ margin: '0 auto 6px', display: 'block' }} />
            <span>No image selected yet</span>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '8px', alignItems: 'center' }}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          style={{
            padding: '8px 12px',
            fontSize: '0.85rem',
            borderRadius: 'var(--admin-radius-sm, 6px)',
            border: '1px solid var(--admin-border)',
            background: 'var(--admin-surface)',
            color: 'var(--admin-text)',
          }}
        />
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: 'var(--admin-radius-sm, 6px)',
            border: '1px solid var(--admin-border)',
            background: 'var(--admin-surface)',
            color: 'var(--admin-text)',
            fontSize: '0.84rem',
            fontWeight: 500,
            cursor: isUploading ? 'not-allowed' : 'pointer',
          }}
        >
          {isUploading ? (
            <>
              <Spinner size={14} className="spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <UploadSimple size={14} />
              <span>Upload</span>
            </>
          )}
          <input type="file" accept="image/*" onChange={handleUpload} disabled={isUploading} style={{ display: 'none' }} />
        </label>
      </div>

      {previewValue ? (
        <div
          style={{
            padding: '8px 10px',
            border: '1px solid var(--admin-border)',
            borderRadius: 'var(--admin-radius-sm, 6px)',
            background: 'var(--admin-surface-hover)',
            fontSize: '0.78rem',
            wordBreak: 'break-all',
          }}
        >
          <span style={{ color: 'var(--admin-text-muted)', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
            {value ? 'Custom URL' : 'Live Fallback URL'}
          </span>
          <code style={{ color: 'var(--admin-text)' }}>{previewValue}</code>
        </div>
      ) : null}

      {hint && <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--admin-text-muted)', lineHeight: 1.4 }}>{hint}</p>}
    </div>
  );
}

function Content() {
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState('');
  const [productLibrary, setProductLibrary] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const [heroText, setHeroText] = useState(defaultHero);
  const [policies, setPolicies] = useState(defaultPolicies);
  const [homepageContent, setHomepageContent] = useState(defaultHomepage);
  const [aboutContent, setAboutContent] = useState(defaultAbout);
  const [contactContent, setContactContent] = useState(defaultContact);
  const [footerContent, setFooterContent] = useState(defaultFooter);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;

      const { data: productRows, error: productsError } = await supabase
        .from('products')
        .select('id, name, price, product_images(image_url, is_hero)');
      if (productsError) throw productsError;

      const mappedProducts = (productRows || []).map((product) => {
        const gallery = (product.product_images || []).map((item) => item.image_url).filter(Boolean);
        const hero = product.product_images?.find((item) => item.is_hero)?.image_url || gallery[0] || '';

        return {
          id: product.id,
          name: product.name,
          hero,
          gallery,
        };
      });

      setProductLibrary(mappedProducts);

      const heroData = data.find((item) => item.key === 'hero_text');
      if (heroData?.value) {
        setHeroText((current) => ({ ...current, ...heroData.value }));
      }

      const policyData = data.find((item) => item.key === 'store_policies');
      if (policyData?.value) {
        setPolicies((current) => ({ ...current, ...policyData.value }));
      }

      const homepageData = data.find((item) => item.key === 'homepage_content');
      if (homepageData?.value) {
        setHomepageContent((current) => ({
          ...current,
          ...homepageData.value,
          trustItemsText: joinLines(homepageData.value.trustItems || [], (item) => `${item.title}|${item.body}`),
          pressMentionsText: joinLines(homepageData.value.pressMentions || [], (item) => item),
          testimonialsText: joinLines(
            homepageData.value.testimonials || [],
            (item) => `${item.quote}|${item.author}|${item.location}`
          ),
          socialImagesText: joinLines(homepageData.value.socialImages || [], (item) => item),
        }));
      }

      const aboutData = data.find((item) => item.key === 'about_page_content');
      if (aboutData?.value) {
        setAboutContent((current) => ({
          ...current,
          ...aboutData.value,
          storyCardsText: joinLines(aboutData.value.storyCards || [], (item) => `${item.title}|${item.body}`),
          makingOfItemsText: joinLines(
            aboutData.value.makingOfItems || [],
            (item) => `${item.img}|${item.title}|${item.text}`
          ),
        }));
      }

      const contactData = data.find((item) => item.key === 'contact_page_content');
      if (contactData?.value) {
        setContactContent((current) => ({ ...current, ...contactData.value }));
      }

      const footerData = data.find((item) => item.key === 'footer_content');
      if (footerData?.value) {
        setFooterContent((current) => ({
          ...current,
          ...footerData.value,
          exploreLinksText: joinLines(
            footerData.value.exploreLinks || [],
            (item) => `${item.label}|${item.path}`
          ),
          supportLinksText: joinLines(
            footerData.value.supportLinks || [],
            (item) => `${item.label}|${item.path}`
          ),
        }));
      }
    } catch (error) {
      console.error('Error fetching content:', error.message);
      setFeedback({ type: 'error', message: `Failed to load storefront content: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key, value, successMessage) => {
    setSavingKey(key);
    try {
      const { error } = await supabase.from('settings').upsert({ key, value });
      if (error) throw error;
      setFeedback({ type: 'success', message: successMessage });
    } catch (error) {
      setFeedback({ type: 'error', message: `Error saving ${key}: ${error.message}` });
    } finally {
      setSavingKey('');
    }
  };

  const handleSaveHero = () =>
    saveSetting('hero_text', heroText, 'Homepage hero banner saved successfully.');

  const handleSavePolicies = () =>
    saveSetting('store_policies', policies, 'Store policies saved successfully.');

  const handleSaveHomepage = () =>
    saveSetting(
      'homepage_content',
      {
        heroEyebrow: homepageContent.heroEyebrow,
        heroImage: homepageContent.heroImage,
        signatureImage: homepageContent.signatureImage,
        secondaryFeatureImage: homepageContent.secondaryFeatureImage,
        processDesignImage: homepageContent.processDesignImage,
        processMaterialImage: homepageContent.processMaterialImage,
        processCraftImage: homepageContent.processCraftImage,
        processFinishImage: homepageContent.processFinishImage,
        collectionEyebrow: homepageContent.collectionEyebrow,
        collectionHeadline: homepageContent.collectionHeadline,
        collectionSummary: homepageContent.collectionSummary,
        socialEyebrow: homepageContent.socialEyebrow,
        socialHeadline: homepageContent.socialHeadline,
        founderQuote: homepageContent.founderQuote,
        trustItems: parsePipeLines(homepageContent.trustItemsText, ['title', 'body']),
        pressMentions: parseSimpleLines(homepageContent.pressMentionsText),
        testimonials: parsePipeLines(homepageContent.testimonialsText, ['quote', 'author', 'location']),
        socialImages: parseSimpleLines(homepageContent.socialImagesText),
      },
      'Homepage curation content saved successfully.'
    );

  const handleSaveAbout = () =>
    saveSetting(
      'about_page_content',
      {
        eyebrow: aboutContent.eyebrow,
        title: aboutContent.title,
        introHeadline: aboutContent.introHeadline,
        introBody: aboutContent.introBody,
        storyCards: parsePipeLines(aboutContent.storyCardsText, ['title', 'body']),
        makingOfEyebrow: aboutContent.makingOfEyebrow,
        makingOfHeadline: aboutContent.makingOfHeadline,
        makingOfItems: parsePipeLines(aboutContent.makingOfItemsText, ['img', 'title', 'text']),
      },
      'About page brand story saved successfully.'
    );

  const handleSaveContact = () =>
    saveSetting(
      'contact_page_content',
      {
        eyebrow: contactContent.eyebrow,
        title: contactContent.title,
        introHeadline: contactContent.introHeadline,
        introBody: contactContent.introBody,
        supportHeading: contactContent.supportHeading,
        supportBody: contactContent.supportBody,
        supportEmail: contactContent.supportEmail,
        studioAddress: contactContent.studioAddress,
        successTitle: contactContent.successTitle,
        successBody: contactContent.successBody,
      },
      'Contact page details saved successfully.'
    );

  const handleSaveFooter = () =>
    saveSetting(
      'footer_content',
      {
        brandCopy: footerContent.brandCopy,
        exploreHeading: footerContent.exploreHeading,
        exploreLinks: parsePipeLines(footerContent.exploreLinksText, ['label', 'path']),
        supportHeading: footerContent.supportHeading,
        supportLinks: parsePipeLines(footerContent.supportLinksText, ['label', 'path']),
        newsletterHeading: footerContent.newsletterHeading,
        newsletterText: footerContent.newsletterText,
      },
      'Footer content saved successfully.'
    );

  const heroProgress = [heroText.headline, heroText.subtext].filter(Boolean).length;
  const homepageProgress = [
    homepageContent.collectionHeadline,
    homepageContent.collectionSummary,
    homepageContent.founderQuote,
    ...parseSimpleLines(homepageContent.trustItemsText),
    ...parseSimpleLines(homepageContent.testimonialsText),
  ].filter(Boolean).length;
  const aboutProgress = [
    aboutContent.title,
    aboutContent.introHeadline,
    ...parseSimpleLines(aboutContent.storyCardsText),
    ...parseSimpleLines(aboutContent.makingOfItemsText),
  ].filter(Boolean).length;
  const contactProgress = [
    contactContent.title,
    contactContent.supportEmail,
    contactContent.supportBody,
    contactContent.studioAddress,
  ].filter(Boolean).length;
  const policyProgress = [
    policies.privacy,
    policies.terms,
    policies.refund,
    policies.shipping,
  ].filter(Boolean).length;
  const footerProgress = [
    footerContent.brandCopy,
    footerContent.exploreHeading,
    footerContent.supportHeading,
    footerContent.newsletterHeading,
    ...parseSimpleLines(footerContent.exploreLinksText),
    ...parseSimpleLines(footerContent.supportLinksText),
  ].filter(Boolean).length;

  const sectionStatuses = {
    hero: getSectionStatus(heroProgress, 2),
    homepage: getSectionStatus(Math.min(homepageProgress, 5), 5),
    about: getSectionStatus(Math.min(aboutProgress, 4), 4),
    contact: getSectionStatus(contactProgress, 4),
    policies: getSectionStatus(policyProgress, 4),
    footer: getSectionStatus(Math.min(footerProgress, 6), 6),
  };

  const heroProduct = productLibrary[0] || null;
  const featureProduct = productLibrary[1] || productLibrary[0] || null;
  const makingOfPreviewItems = parsePipeLines(aboutContent.makingOfItemsText, ['img', 'title', 'text']);

  const fallbackHeroImage =
    heroProduct?.gallery?.find((image) => image && image !== heroProduct?.hero) ||
    heroProduct?.hero ||
    '';

  const fallbackFeatureImage =
    featureProduct?.gallery?.find((image) => image && image !== featureProduct?.hero) ||
    featureProduct?.hero ||
    fallbackHeroImage;

  const homepagePreviewImages = {
    heroImage: homepageContent.heroImage || fallbackHeroImage,
    signatureImage: homepageContent.signatureImage || heroProduct?.hero || fallbackHeroImage,
    secondaryFeatureImage: homepageContent.secondaryFeatureImage || fallbackFeatureImage,
    processDesignImage:
      homepageContent.processDesignImage ||
      makingOfPreviewItems[0]?.img ||
      fallbackHeroImage,
    processMaterialImage:
      homepageContent.processMaterialImage ||
      makingOfPreviewItems[1]?.img ||
      fallbackFeatureImage ||
      fallbackHeroImage,
    processCraftImage:
      homepageContent.processCraftImage ||
      makingOfPreviewItems[2]?.img ||
      heroProduct?.hero ||
      fallbackHeroImage,
    processFinishImage:
      homepageContent.processFinishImage ||
      heroProduct?.gallery?.[1] ||
      featureProduct?.gallery?.[1] ||
      featureProduct?.hero ||
      fallbackHeroImage,
  };

  if (loading) {
    return (
      <div className="admin-page-container">
        <AdminPageHeader
          eyebrow="Storefront CMS"
          title="Pages & Content"
          description="Manage copy, media, brand storytelling, and store policies across all customer-facing pages."
        />
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
          Loading storefront content...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container" style={{ display: 'grid', gap: '24px' }}>
      <AdminPageHeader
        eyebrow="Storefront CMS"
        title="Pages & Content"
        description="Manage copy, media, brand storytelling, and store policies across all customer-facing pages."
      />

      {feedback && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: 'var(--admin-radius-md, 8px)',
            fontSize: '0.9rem',
            background: feedback.type === 'error' ? 'var(--admin-danger-subtle)' : 'var(--admin-success-subtle)',
            color: feedback.type === 'error' ? 'var(--admin-danger)' : 'var(--admin-success)',
            border: `1px solid ${feedback.type === 'error' ? 'var(--admin-danger)' : 'var(--admin-success)'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {feedback.type === 'error' ? <WarningCircle size={18} /> : <CheckCircle size={18} />}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '4px' }}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Homepage Content"
          value={sectionStatuses.homepage.label}
          description="Hero banner, curation & testimonials"
          icon={House}
          tone={sectionStatuses.homepage.tone === 'success' ? 'success' : 'neutral'}
        />
        <StatCard
          label="Brand Pages"
          value={sectionStatuses.about.label}
          description="Storytelling, craft & contact channels"
          icon={BookOpen}
          tone={sectionStatuses.about.tone === 'success' ? 'success' : 'neutral'}
        />
        <StatCard
          label="Store Support & Legal"
          value={sectionStatuses.policies.label}
          description="Terms, privacy, refunds & shipping"
          icon={ShieldCheck}
          tone={sectionStatuses.policies.tone === 'success' ? 'success' : 'neutral'}
        />
      </div>

      <div className="cms-page-grid" style={{ display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)', gap: '24px', alignItems: 'start' }}>
        {/* Sticky section quick navigation */}
        <aside
          className="card"
          style={{
            position: 'sticky',
            top: '24px',
            padding: '16px',
            display: 'grid',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--admin-text-muted)' }}>
            Page Content Sections
          </div>
          <nav style={{ display: 'grid', gap: '6px' }}>
            {sections.map((section) => {
              const Icon = section.icon;
              const status = sectionStatuses[section.id];
              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--admin-radius-sm, 6px)',
                    border: '1px solid var(--admin-border)',
                    background: 'var(--admin-surface)',
                    color: 'var(--admin-text)',
                    textDecoration: 'none',
                    fontSize: '0.86rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon size={16} style={{ color: 'var(--admin-text-muted)' }} />
                    <span style={{ fontWeight: 500 }}>{section.label}</span>
                  </span>
                  <StatusBadge status={status.tone}>{status.label}</StatusBadge>
                </a>
              );
            })}
          </nav>
          <div
            style={{
              paddingTop: '12px',
              borderTop: '1px solid var(--admin-border)',
              color: 'var(--admin-text-muted)',
              fontSize: '0.8rem',
              lineHeight: 1.5,
            }}
          >
            Product catalog, orders, and payment flows remain independent. These editors safely feed the live website.
          </div>
        </aside>

        {/* Content sections editors */}
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Section: Hero */}
          <section id="hero" className="card" style={{ scrollMarginTop: '24px', padding: '24px' }}>
            <SectionHeader
              title="Homepage Hero Banner"
              body="Configure the primary headline and supporting copy displayed above the fold on the homepage."
            />
            <div style={{ display: 'grid', gap: '16px' }}>
              <FormField label="Main Headline" id="hero-headline">
                <input
                  id="hero-headline"
                  type="text"
                  value={heroText.headline}
                  onChange={(e) => setHeroText({ ...heroText, headline: e.target.value })}
                  placeholder="e.g. Precision in Every Second"
                />
              </FormField>

              <FormField label="Subtext" hint="Secondary tagline guiding the tone of the storefront" id="hero-subtext">
                <textarea
                  id="hero-subtext"
                  value={heroText.subtext}
                  onChange={(e) => setHeroText({ ...heroText, subtext: e.target.value })}
                  rows={3}
                  placeholder="e.g. Handcrafted wooden wall clocks created for modern living spaces."
                />
              </FormField>

              <PreviewNote title="Storefront Banner Preview">
                <div style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '4px' }}>
                  {heroText.headline || 'Your homepage headline will appear here.'}
                </div>
                <div style={{ color: 'var(--admin-text-muted)' }}>
                  {heroText.subtext || 'Add a short supporting line to guide the tone of the hero section.'}
                </div>
              </PreviewNote>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSaveHero}
                  disabled={savingKey === 'hero_text'}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <FloppyDisk size={16} />
                  {savingKey === 'hero_text' ? 'Saving...' : 'Save Hero Banner'}
                </button>
              </div>
            </div>
          </section>

          {/* Section: Homepage Sections */}
          <section id="homepage" className="card" style={{ scrollMarginTop: '24px', padding: '24px' }}>
            <SectionHeader
              title="Homepage Curation & Storytelling"
              body="Merchandising headlines, process steps, trust points, and press quotes for the homepage."
            />
            <div style={{ display: 'grid', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <FormField label="Hero Eyebrow" id="hp-hero-eyebrow">
                  <input
                    id="hp-hero-eyebrow"
                    type="text"
                    value={homepageContent.heroEyebrow}
                    onChange={(e) => setHomepageContent({ ...homepageContent, heroEyebrow: e.target.value })}
                  />
                </FormField>
                <FormField label="Collection Eyebrow" id="hp-col-eyebrow">
                  <input
                    id="hp-col-eyebrow"
                    type="text"
                    value={homepageContent.collectionEyebrow}
                    onChange={(e) => setHomepageContent({ ...homepageContent, collectionEyebrow: e.target.value })}
                  />
                </FormField>
              </div>

              <div>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--admin-text)', display: 'block', marginBottom: '4px' }}>
                  Homepage Visual Assets
                </label>
                <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                  Upload campaign-specific or transparent imagery for hero slots without modifying product gallery media.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  <ImageSlotField
                    label="Hero Product Image"
                    value={homepageContent.heroImage}
                    previewValue={homepagePreviewImages.heroImage}
                    onChange={(val) => setHomepageContent({ ...homepageContent, heroImage: val })}
                    onError={(err) => setFeedback({ type: 'error', message: err })}
                    hint="Used in the primary hero fold under the headline."
                  />
                  <ImageSlotField
                    label="Signature Feature Image"
                    value={homepageContent.signatureImage}
                    previewValue={homepagePreviewImages.signatureImage}
                    onChange={(val) => setHomepageContent({ ...homepageContent, signatureImage: val })}
                    onError={(err) => setFeedback({ type: 'error', message: err })}
                    hint="Used in the first feature section: The Core."
                  />
                  <ImageSlotField
                    label="Secondary Feature Image"
                    value={homepageContent.secondaryFeatureImage}
                    previewValue={homepagePreviewImages.secondaryFeatureImage}
                    onChange={(val) => setHomepageContent({ ...homepageContent, secondaryFeatureImage: val })}
                    onError={(err) => setFeedback({ type: 'error', message: err })}
                    hint="Used in the second product feature section."
                  />
                  <ImageSlotField
                    label="Process: Design Image"
                    value={homepageContent.processDesignImage}
                    previewValue={homepagePreviewImages.processDesignImage}
                    onChange={(val) => setHomepageContent({ ...homepageContent, processDesignImage: val })}
                    onError={(err) => setFeedback({ type: 'error', message: err })}
                    hint="Shown when the Design process step is active."
                  />
                  <ImageSlotField
                    label="Process: Material Image"
                    value={homepageContent.processMaterialImage}
                    previewValue={homepagePreviewImages.processMaterialImage}
                    onChange={(val) => setHomepageContent({ ...homepageContent, processMaterialImage: val })}
                    onError={(err) => setFeedback({ type: 'error', message: err })}
                    hint="Shown when the Material process step is active."
                  />
                  <ImageSlotField
                    label="Process: Craft Image"
                    value={homepageContent.processCraftImage}
                    previewValue={homepagePreviewImages.processCraftImage}
                    onChange={(val) => setHomepageContent({ ...homepageContent, processCraftImage: val })}
                    onError={(err) => setFeedback({ type: 'error', message: err })}
                    hint="Shown when the Craft step is active."
                  />
                  <ImageSlotField
                    label="Process: Finish Image"
                    value={homepageContent.processFinishImage}
                    previewValue={homepagePreviewImages.processFinishImage}
                    onChange={(val) => setHomepageContent({ ...homepageContent, processFinishImage: val })}
                    onError={(err) => setFeedback({ type: 'error', message: err })}
                    hint="Shown when the Finish step is active."
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <FormField label="Collection Headline" id="hp-col-headline">
                  <input
                    id="hp-col-headline"
                    type="text"
                    value={homepageContent.collectionHeadline}
                    onChange={(e) => setHomepageContent({ ...homepageContent, collectionHeadline: e.target.value })}
                  />
                </FormField>
                <FormField label="Collection Summary" id="hp-col-summary">
                  <textarea
                    id="hp-col-summary"
                    rows={2}
                    value={homepageContent.collectionSummary}
                    onChange={(e) => setHomepageContent({ ...homepageContent, collectionSummary: e.target.value })}
                  />
                </FormField>
              </div>

              <FormField label="Founder Quote" hint="Personal brand quote highlighted on the homepage" id="hp-quote">
                <textarea
                  id="hp-quote"
                  rows={2}
                  value={homepageContent.founderQuote}
                  onChange={(e) => setHomepageContent({ ...homepageContent, founderQuote: e.target.value })}
                />
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <FormField label="Social Section Eyebrow" id="hp-soc-eyebrow">
                  <input
                    id="hp-soc-eyebrow"
                    type="text"
                    value={homepageContent.socialEyebrow}
                    onChange={(e) => setHomepageContent({ ...homepageContent, socialEyebrow: e.target.value })}
                  />
                </FormField>
                <FormField label="Social Section Headline" id="hp-soc-headline">
                  <input
                    id="hp-soc-headline"
                    type="text"
                    value={homepageContent.socialHeadline}
                    onChange={(e) => setHomepageContent({ ...homepageContent, socialHeadline: e.target.value })}
                  />
                </FormField>
              </div>

              <FormField label="Trust & Guarantee Items" hint="Format: Title|Body (one item per line)" id="hp-trust">
                <textarea
                  id="hp-trust"
                  rows={3}
                  value={homepageContent.trustItemsText}
                  onChange={(e) => setHomepageContent({ ...homepageContent, trustItemsText: e.target.value })}
                  placeholder="Insured Delivery|White-glove packaging and tracked dispatch."
                />
              </FormField>

              <FormField label="Press Mentions" hint="One publication or outlet name per line" id="hp-press">
                <textarea
                  id="hp-press"
                  rows={3}
                  value={homepageContent.pressMentionsText}
                  onChange={(e) => setHomepageContent({ ...homepageContent, pressMentionsText: e.target.value })}
                  placeholder="Architectural Digest&#10;Elle Decor"
                />
              </FormField>

              <FormField label="Customer Testimonials" hint="Format: Quote|Author|Location (one per line)" id="hp-testimonials">
                <textarea
                  id="hp-testimonials"
                  rows={4}
                  value={homepageContent.testimonialsText}
                  onChange={(e) => setHomepageContent({ ...homepageContent, testimonialsText: e.target.value })}
                  placeholder="A timeless statement piece.|James M.|Mumbai"
                />
              </FormField>

              <FormField label="Social Gallery Images" hint="One image URL per line" id="hp-social-imgs">
                <textarea
                  id="hp-social-imgs"
                  rows={3}
                  value={homepageContent.socialImagesText}
                  onChange={(e) => setHomepageContent({ ...homepageContent, socialImagesText: e.target.value })}
                  placeholder="https://..."
                />
              </FormField>

              <PreviewNote title="Homepage Snapshot">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                  <div><strong>Trust Points:</strong> {parseSimpleLines(homepageContent.trustItemsText).length}</div>
                  <div><strong>Press Mentions:</strong> {parseSimpleLines(homepageContent.pressMentionsText).length}</div>
                  <div><strong>Testimonials:</strong> {parseSimpleLines(homepageContent.testimonialsText).length}</div>
                  <div><strong>Social Media:</strong> {parseSimpleLines(homepageContent.socialImagesText).length}</div>
                </div>
              </PreviewNote>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSaveHomepage}
                  disabled={savingKey === 'homepage_content'}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <FloppyDisk size={16} />
                  {savingKey === 'homepage_content' ? 'Saving...' : 'Save Homepage Sections'}
                </button>
              </div>
            </div>
          </section>

          {/* Section: About Page */}
          <section id="about" className="card" style={{ scrollMarginTop: '24px', padding: '24px' }}>
            <SectionHeader
              title="About Page & Brand Story"
              body="Narrate the history, design philosophy, materials sourcing, and workshop assembly story."
            />
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <FormField label="Page Eyebrow" id="abt-eyebrow">
                  <input
                    id="abt-eyebrow"
                    type="text"
                    value={aboutContent.eyebrow}
                    onChange={(e) => setAboutContent({ ...aboutContent, eyebrow: e.target.value })}
                  />
                </FormField>
                <FormField label="Page Title" id="abt-title">
                  <input
                    id="abt-title"
                    type="text"
                    value={aboutContent.title}
                    onChange={(e) => setAboutContent({ ...aboutContent, title: e.target.value })}
                  />
                </FormField>
              </div>

              <FormField label="Intro Headline" id="abt-intro-headline">
                <input
                  id="abt-intro-headline"
                  type="text"
                  value={aboutContent.introHeadline}
                  onChange={(e) => setAboutContent({ ...aboutContent, introHeadline: e.target.value })}
                />
              </FormField>

              <FormField label="Intro Body" id="abt-intro-body">
                <textarea
                  id="abt-intro-body"
                  rows={3}
                  value={aboutContent.introBody}
                  onChange={(e) => setAboutContent({ ...aboutContent, introBody: e.target.value })}
                />
              </FormField>

              <FormField label="Story Cards" hint="Format: Title|Body (one card per line)" id="abt-story-cards">
                <textarea
                  id="abt-story-cards"
                  rows={4}
                  value={aboutContent.storyCardsText}
                  onChange={(e) => setAboutContent({ ...aboutContent, storyCardsText: e.target.value })}
                  placeholder="Sustainable Timber|We source responsibly harvested hardwood from certified forests."
                />
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <FormField label="Making-of Eyebrow" id="abt-mo-eyebrow">
                  <input
                    id="abt-mo-eyebrow"
                    type="text"
                    value={aboutContent.makingOfEyebrow}
                    onChange={(e) => setAboutContent({ ...aboutContent, makingOfEyebrow: e.target.value })}
                  />
                </FormField>
                <FormField label="Making-of Headline" id="abt-mo-headline">
                  <input
                    id="abt-mo-headline"
                    type="text"
                    value={aboutContent.makingOfHeadline}
                    onChange={(e) => setAboutContent({ ...aboutContent, makingOfHeadline: e.target.value })}
                  />
                </FormField>
              </div>

              <FormField label="Making-of Cards" hint="Format: Image URL|Title|Body (one card per line)" id="abt-mo-cards">
                <textarea
                  id="abt-mo-cards"
                  rows={4}
                  value={aboutContent.makingOfItemsText}
                  onChange={(e) => setAboutContent({ ...aboutContent, makingOfItemsText: e.target.value })}
                  placeholder="https://...|Sourcing the Timber|We work directly with certified sustainable mills."
                />
              </FormField>

              <PreviewNote title="About Page Overview">
                <div><strong>Title:</strong> {aboutContent.title || 'Not set'}</div>
                <div><strong>Story Cards:</strong> {parseSimpleLines(aboutContent.storyCardsText).length} defined</div>
                <div><strong>Behind The Scenes Steps:</strong> {parseSimpleLines(aboutContent.makingOfItemsText).length} defined</div>
              </PreviewNote>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSaveAbout}
                  disabled={savingKey === 'about_page_content'}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <FloppyDisk size={16} />
                  {savingKey === 'about_page_content' ? 'Saving...' : 'Save About Page'}
                </button>
              </div>
            </div>
          </section>

          {/* Section: Contact Page */}
          <section id="contact" className="card" style={{ scrollMarginTop: '24px', padding: '24px' }}>
            <SectionHeader
              title="Contact Page & Support Channels"
              body="Customer service contact details, studio physical address, and inquiry submission confirmation."
            />
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <FormField label="Page Eyebrow" id="cnt-eyebrow">
                  <input
                    id="cnt-eyebrow"
                    type="text"
                    value={contactContent.eyebrow}
                    onChange={(e) => setContactContent({ ...contactContent, eyebrow: e.target.value })}
                  />
                </FormField>
                <FormField label="Page Title" id="cnt-title">
                  <input
                    id="cnt-title"
                    type="text"
                    value={contactContent.title}
                    onChange={(e) => setContactContent({ ...contactContent, title: e.target.value })}
                  />
                </FormField>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <FormField label="Intro Headline" id="cnt-intro-headline">
                  <input
                    id="cnt-intro-headline"
                    type="text"
                    value={contactContent.introHeadline}
                    onChange={(e) => setContactContent({ ...contactContent, introHeadline: e.target.value })}
                  />
                </FormField>
                <FormField label="Support Email" id="cnt-email">
                  <input
                    id="cnt-email"
                    type="email"
                    value={contactContent.supportEmail}
                    onChange={(e) => setContactContent({ ...contactContent, supportEmail: e.target.value })}
                  />
                </FormField>
              </div>

              <FormField label="Intro Body Copy" id="cnt-intro-body">
                <textarea
                  id="cnt-intro-body"
                  rows={2}
                  value={contactContent.introBody}
                  onChange={(e) => setContactContent({ ...contactContent, introBody: e.target.value })}
                />
              </FormField>

              <FormField label="Support Heading" id="cnt-support-heading">
                <input
                  id="cnt-support-heading"
                  type="text"
                  value={contactContent.supportHeading}
                  onChange={(e) => setContactContent({ ...contactContent, supportHeading: e.target.value })}
                />
              </FormField>

              <FormField label="Support Details" id="cnt-support-body">
                <textarea
                  id="cnt-support-body"
                  rows={2}
                  value={contactContent.supportBody}
                  onChange={(e) => setContactContent({ ...contactContent, supportBody: e.target.value })}
                />
              </FormField>

              <FormField label="Studio Address" hint="One address row per line" id="cnt-address">
                <textarea
                  id="cnt-address"
                  rows={3}
                  value={contactContent.studioAddress}
                  onChange={(e) => setContactContent({ ...contactContent, studioAddress: e.target.value })}
                />
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <FormField label="Success Message Title" id="cnt-success-title">
                  <input
                    id="cnt-success-title"
                    type="text"
                    value={contactContent.successTitle}
                    onChange={(e) => setContactContent({ ...contactContent, successTitle: e.target.value })}
                  />
                </FormField>
                <FormField label="Success Message Body" id="cnt-success-body">
                  <input
                    id="cnt-success-body"
                    type="text"
                    value={contactContent.successBody}
                    onChange={(e) => setContactContent({ ...contactContent, successBody: e.target.value })}
                  />
                </FormField>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSaveContact}
                  disabled={savingKey === 'contact_page_content'}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <FloppyDisk size={16} />
                  {savingKey === 'contact_page_content' ? 'Saving...' : 'Save Contact Page'}
                </button>
              </div>
            </div>
          </section>

          {/* Section: Store Policies */}
          <section id="policies" className="card" style={{ scrollMarginTop: '24px', padding: '24px' }}>
            <SectionHeader
              title="Store Policies & Legal Terms"
              body="Ensure legal compliance with clear terms, privacy disclosures, return policies, and shipping timelines."
            />
            <div style={{ display: 'grid', gap: '16px' }}>
              <FormField label="Privacy Policy" hint="Data protection, cookies, and customer privacy details" id="pol-privacy">
                <textarea
                  id="pol-privacy"
                  rows={4}
                  value={policies.privacy || ''}
                  onChange={(e) => setPolicies({ ...policies, privacy: e.target.value })}
                  placeholder="Detail how customer data is processed and stored..."
                />
              </FormField>

              <FormField label="Terms & Conditions" hint="Purchase agreements, warranty limitations, and jurisdiction" id="pol-terms">
                <textarea
                  id="pol-terms"
                  rows={4}
                  value={policies.terms || ''}
                  onChange={(e) => setPolicies({ ...policies, terms: e.target.value })}
                  placeholder="Detail ordering terms, payment acceptance, and intellectual property..."
                />
              </FormField>

              <FormField label="Refund & Return Policy" hint="Window for returns, condition requirements, and exchange process" id="pol-refund">
                <textarea
                  id="pol-refund"
                  rows={4}
                  value={policies.refund || ''}
                  onChange={(e) => setPolicies({ ...policies, refund: e.target.value })}
                  placeholder="Detail return eligibility, return shipment logistics, and refund timelines..."
                />
              </FormField>

              <FormField label="Shipping & Dispatch Policy" hint="Carriers, transit times, handling duration, and tracking" id="pol-shipping">
                <textarea
                  id="pol-shipping"
                  rows={4}
                  value={policies.shipping || ''}
                  onChange={(e) => setPolicies({ ...policies, shipping: e.target.value })}
                  placeholder="Detail domestic and international shipping schedules and courier partners..."
                />
              </FormField>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSavePolicies}
                  disabled={savingKey === 'store_policies'}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <FloppyDisk size={16} />
                  {savingKey === 'store_policies' ? 'Saving...' : 'Save Policies'}
                </button>
              </div>
            </div>
          </section>

          {/* Section: Footer */}
          <section id="footer" className="card" style={{ scrollMarginTop: '24px', padding: '24px' }}>
            <SectionHeader
              title="Storefront Footer & Navigation"
              body="Configure footer branding text, quick links columns, and newsletter invitation copy."
            />
            <div style={{ display: 'grid', gap: '16px' }}>
              <FormField label="Brand Copy / Mission Statement" hint="Short summary displayed under the brand mark in the footer" id="ft-brand">
                <textarea
                  id="ft-brand"
                  rows={3}
                  value={footerContent.brandCopy}
                  onChange={(e) => setFooterContent({ ...footerContent, brandCopy: e.target.value })}
                />
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <FormField label="Explore Column Heading" id="ft-exp-head">
                  <input
                    id="ft-exp-head"
                    type="text"
                    value={footerContent.exploreHeading}
                    onChange={(e) => setFooterContent({ ...footerContent, exploreHeading: e.target.value })}
                  />
                </FormField>
                <FormField label="Support / Legal Column Heading" id="ft-sup-head">
                  <input
                    id="ft-sup-head"
                    type="text"
                    value={footerContent.supportHeading}
                    onChange={(e) => setFooterContent({ ...footerContent, supportHeading: e.target.value })}
                  />
                </FormField>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <FormField label="Explore Navigation Links" hint="Format: Label|Path (one link per line)" id="ft-exp-links">
                  <textarea
                    id="ft-exp-links"
                    rows={4}
                    value={footerContent.exploreLinksText}
                    onChange={(e) => setFooterContent({ ...footerContent, exploreLinksText: e.target.value })}
                    placeholder="Shop All|/shop&#10;Our Story|/about"
                  />
                </FormField>
                <FormField label="Support Navigation Links" hint="Format: Label|Path (one link per line)" id="ft-sup-links">
                  <textarea
                    id="ft-sup-links"
                    rows={4}
                    value={footerContent.supportLinksText}
                    onChange={(e) => setFooterContent({ ...footerContent, supportLinksText: e.target.value })}
                    placeholder="Privacy & Policies|/policies&#10;Track Order|/track"
                  />
                </FormField>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <FormField label="Newsletter Heading" id="ft-nl-head">
                  <input
                    id="ft-nl-head"
                    type="text"
                    value={footerContent.newsletterHeading}
                    onChange={(e) => setFooterContent({ ...footerContent, newsletterHeading: e.target.value })}
                  />
                </FormField>
                <FormField label="Newsletter Description" id="ft-nl-text">
                  <input
                    id="ft-nl-text"
                    type="text"
                    value={footerContent.newsletterText}
                    onChange={(e) => setFooterContent({ ...footerContent, newsletterText: e.target.value })}
                  />
                </FormField>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSaveFooter}
                  disabled={savingKey === 'footer_content'}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <FloppyDisk size={16} />
                  {savingKey === 'footer_content' ? 'Saving...' : 'Save Footer'}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Content;
