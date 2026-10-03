import { useEffect, useMemo, useState } from 'react';
import {
  FloppyDisk,
  Plus,
  Trash,
  Info,
  ArrowUp,
  ArrowDown,
  Compass,
  LinkBreak,
  CheckCircle,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import { supabase } from '../lib/supabase';
import AdminPageHeader from '../components/common/AdminPageHeader';
import StatCard from '../components/common/StatCard';
import ToggleSwitch from '../components/common/ToggleSwitch';
import FormField from '../components/common/FormField';
import StatusBadge from '../components/common/StatusBadge';

const isJournalPath = (path) => {
  const clean = String(path || '').trim();
  return clean === '/blog' || clean === '/journal' || clean.startsWith('/journal/');
};

const defaultNavLinks = [
  { label: 'Home', path: '/', visible: true },
  { label: 'Shop', path: '/shop', visible: true },
  { label: 'About', path: '/about', visible: true },
  { label: 'Journal', path: '/blog', visible: true },
  { label: 'Contact', path: '/contact', visible: true },
];

const defaultFooterContent = {
  brandCopy: '',
  exploreHeading: 'Explore',
  exploreLinks: [
    { label: 'Shop All', path: '/shop', visible: true },
    { label: 'Our Story', path: '/about', visible: true },
    { label: 'Journal', path: '/blog', visible: true },
    { label: 'Contact', path: '/contact', visible: true },
  ],
  supportHeading: 'Support',
  supportLinks: [
    { label: 'Privacy & Policies', path: '/policies', visible: true },
    { label: 'Track Order', path: '/track', visible: true },
    { label: 'My Account', path: '/account', visible: true },
  ],
  newsletterHeading: 'Stay Updated',
  newsletterText: '',
};

function LinkRow({ link, index, total, onChange, onRemove, onMoveUp, onMoveDown, sectionPrefix }) {
  const isJournal = isJournalPath(link.path);

  return (
    <div
      className="nav-link-row"
      style={{
        border: '1px solid var(--admin-border)',
        borderRadius: 'var(--admin-radius-md, 8px)',
        padding: '16px',
        background: 'var(--admin-surface)',
        display: 'grid',
        gap: '12px',
        transition: 'border-color 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'var(--admin-surface-hover)',
              color: 'var(--admin-text-muted)',
              border: '1px solid var(--admin-border)',
            }}
          >
            #{index + 1}
          </span>
          <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--admin-text)' }}>
            {link.label || 'Untitled Link'}
          </span>
          <StatusBadge status={link.visible !== false ? 'success' : 'neutral'}>
            {link.visible !== false ? 'Visible' : 'Hidden'}
          </StatusBadge>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            style={{ padding: '4px 8px', opacity: index === 0 ? 0.4 : 1 }}
            title="Move link up"
            aria-label="Move link up"
          >
            <ArrowUp size={14} />
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onMoveDown(index)}
            disabled={index === total - 1}
            style={{ padding: '4px 8px', opacity: index === total - 1 ? 0.4 : 1 }}
            title="Move link down"
            aria-label="Move link down"
          >
            <ArrowDown size={14} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <FormField label="Menu Label">
          <input
            type="text"
            value={link.label}
            onChange={(e) => onChange(index, 'label', e.target.value)}
            placeholder="e.g. Shop All"
          />
        </FormField>
        <FormField label="Destination URL / Route">
          <input
            type="text"
            value={link.path}
            onChange={(e) => onChange(index, 'path', e.target.value)}
            placeholder="e.g. /shop"
          />
        </FormField>
      </div>

      {isJournal && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: 'var(--admin-radius-sm, 6px)',
            background: 'var(--admin-info-subtle)',
            color: 'var(--admin-info)',
            border: '1px solid var(--admin-info)',
            fontSize: '0.82rem',
          }}
        >
          <Info size={16} weight="bold" />
          <span>Journal must be enabled in Settings before its navigation links can appear on the storefront.</span>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '10px',
          borderTop: '1px solid var(--admin-border)',
        }}
      >
        <ToggleSwitch
          id={`${sectionPrefix}-toggle-${index}`}
          checked={link.visible !== false}
          onChange={(val) => onChange(index, 'visible', val)}
          label={link.visible !== false ? 'Visible on Storefront' : 'Hidden from Storefront'}
          description="Controls link visibility independently in this menu"
        />
        <button
          type="button"
          className="btn-secondary"
          onClick={() => onRemove(index)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--admin-danger)',
            fontSize: '0.84rem',
            padding: '6px 10px',
          }}
          title="Remove link"
        >
          <Trash size={14} />
          <span>Remove</span>
        </button>
      </div>
    </div>
  );
}

function NavigationManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [navLinks, setNavLinks] = useState(defaultNavLinks);
  const [footerContent, setFooterContent] = useState(defaultFooterContent);

  useEffect(() => {
    fetchNavigation();
  }, []);

  const fetchNavigation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['navigation_content', 'footer_content']);

      if (error) throw error;

      const navData = data?.find((item) => item.key === 'navigation_content')?.value;
      const footerData = data?.find((item) => item.key === 'footer_content')?.value;

      if (navData?.links?.length) {
        setNavLinks(navData.links.map((link) => ({ visible: true, ...link })));
      }

      if (footerData) {
        setFooterContent({
          ...defaultFooterContent,
          ...footerData,
          exploreLinks: (footerData.exploreLinks || defaultFooterContent.exploreLinks).map((link) => ({
            visible: true,
            ...link,
          })),
          supportLinks: (footerData.supportLinks || defaultFooterContent.supportLinks).map((link) => ({
            visible: true,
            ...link,
          })),
        });
      }
    } catch (error) {
      console.error('Error fetching navigation content:', error.message);
      setFeedback({ type: 'error', message: `Failed to load navigation: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(
    () => ({
      navVisible: navLinks.filter((link) => link.visible !== false).length,
      navTotal: navLinks.length,
      exploreVisible: footerContent.exploreLinks.filter((link) => link.visible !== false).length,
      exploreTotal: footerContent.exploreLinks.length,
      supportVisible: footerContent.supportLinks.filter((link) => link.visible !== false).length,
      supportTotal: footerContent.supportLinks.length,
    }),
    [footerContent.exploreLinks, footerContent.supportLinks, navLinks]
  );

  const updateLinks = (setter, links, index, field, value) => {
    setter(links.map((link, linkIndex) => (linkIndex === index ? { ...link, [field]: value } : link)));
  };

  const addLink = (setter, links) => {
    setter([...links, { label: '', path: '', visible: true }]);
  };

  const removeLink = (setter, links, index) => {
    setter(links.filter((_, linkIndex) => linkIndex !== index));
  };

  const moveLink = (setter, links, index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= links.length) return;
    const copy = [...links];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setter(copy);
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const navigationPayload = {
        links: navLinks
          .map((link) => ({
            label: String(link.label || '').trim(),
            path: String(link.path || '').trim(),
            visible: link.visible !== false,
          }))
          .filter((link) => link.label && link.path),
      };

      const footerPayload = {
        ...footerContent,
        exploreLinks: footerContent.exploreLinks
          .map((link) => ({
            label: String(link.label || '').trim(),
            path: String(link.path || '').trim(),
            visible: link.visible !== false,
          }))
          .filter((link) => link.label && link.path),
        supportLinks: footerContent.supportLinks
          .map((link) => ({
            label: String(link.label || '').trim(),
            path: String(link.path || '').trim(),
            visible: link.visible !== false,
          }))
          .filter((link) => link.label && link.path),
      };

      const { error } = await supabase.from('settings').upsert([
        { key: 'navigation_content', value: navigationPayload },
        { key: 'footer_content', value: footerPayload },
      ]);

      if (error) throw error;
      setFeedback({ type: 'success', message: 'Navigation menus saved successfully.' });
    } catch (error) {
      setFeedback({ type: 'error', message: `Failed to save navigation: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page-container">
        <AdminPageHeader
          eyebrow="STOREFRONT"
          title="Navigation Manager"
          description="Organize header navigation and footer columns. Visibility toggles work directly alongside feature availability."
        />
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
          Loading navigation controls...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container" style={{ display: 'grid', gap: '24px' }}>
      <AdminPageHeader
        eyebrow="STOREFRONT"
        title="Navigation Manager"
        description="Organize header navigation and footer columns. Visibility toggles work directly alongside feature availability."
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <FloppyDisk size={16} />
            <span>{saving ? 'Saving...' : 'Save Navigation'}</span>
          </button>
        }
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
          label="Header Links"
          value={`${summary.navVisible} / ${summary.navTotal}`}
          description="Active in site header"
          icon={Compass}
          tone="neutral"
        />
        <StatCard
          label="Footer — Explore"
          value={`${summary.exploreVisible} / ${summary.exploreTotal}`}
          description="First footer navigation column"
          icon={Compass}
          tone="neutral"
        />
        <StatCard
          label="Footer — Support"
          value={`${summary.supportVisible} / ${summary.supportTotal}`}
          description="Second footer legal/care column"
          icon={Compass}
          tone="neutral"
        />
      </div>

      <div style={{ display: 'grid', gap: '24px' }}>
        {/* HEADER NAVIGATION */}
        <section className="card" style={{ padding: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--admin-border)',
              marginBottom: '20px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 4px', color: 'var(--admin-text)' }}>
                Header Navigation Bar
              </h3>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--admin-text-muted)' }}>
                Primary navigation menu links displayed in the storefront top header.
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => addLink(setNavLinks, navLinks)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} />
              <span>Add Link</span>
            </button>
          </div>

          <div style={{ display: 'grid', gap: '14px' }}>
            {navLinks.map((link, index) => (
              <LinkRow
                key={`nav-${index}`}
                link={link}
                index={index}
                total={navLinks.length}
                sectionPrefix="nav"
                onChange={(rowIndex, field, value) => updateLinks(setNavLinks, navLinks, rowIndex, field, value)}
                onRemove={(rowIndex) => removeLink(setNavLinks, navLinks, rowIndex)}
                onMoveUp={(rowIndex) => moveLink(setNavLinks, navLinks, rowIndex, -1)}
                onMoveDown={(rowIndex) => moveLink(setNavLinks, navLinks, rowIndex, 1)}
              />
            ))}
          </div>
        </section>

        {/* FOOTER — EXPLORE */}
        <section className="card" style={{ padding: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--admin-border)',
              marginBottom: '20px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 4px', color: 'var(--admin-text)' }}>
                Footer — Explore Column
              </h3>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--admin-text-muted)' }}>
                First navigation column in the website footer for brand discovery and shopping links.
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                setFooterContent((current) => ({
                  ...current,
                  exploreLinks: [...current.exploreLinks, { label: '', path: '', visible: true }],
                }))
              }
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} />
              <span>Add Explore Link</span>
            </button>
          </div>

          <div style={{ marginBottom: '18px', maxWidth: '360px' }}>
            <FormField label="Column Header Title">
              <input
                type="text"
                value={footerContent.exploreHeading}
                onChange={(e) =>
                  setFooterContent((current) => ({ ...current, exploreHeading: e.target.value }))
                }
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gap: '14px' }}>
            {footerContent.exploreLinks.map((link, index) => (
              <LinkRow
                key={`explore-${index}`}
                link={link}
                index={index}
                total={footerContent.exploreLinks.length}
                sectionPrefix="explore"
                onChange={(rowIndex, field, value) =>
                  setFooterContent((current) => ({
                    ...current,
                    exploreLinks: current.exploreLinks.map((item, itemIndex) =>
                      itemIndex === rowIndex ? { ...item, [field]: value } : item
                    ),
                  }))
                }
                onRemove={(rowIndex) =>
                  setFooterContent((current) => ({
                    ...current,
                    exploreLinks: current.exploreLinks.filter((_, itemIndex) => itemIndex !== rowIndex),
                  }))
                }
                onMoveUp={(rowIndex) =>
                  moveLink(
                    (links) => setFooterContent((curr) => ({ ...curr, exploreLinks: links })),
                    footerContent.exploreLinks,
                    rowIndex,
                    -1
                  )
                }
                onMoveDown={(rowIndex) =>
                  moveLink(
                    (links) => setFooterContent((curr) => ({ ...curr, exploreLinks: links })),
                    footerContent.exploreLinks,
                    rowIndex,
                    1
                  )
                }
              />
            ))}
          </div>
        </section>

        {/* FOOTER — SUPPORT */}
        <section className="card" style={{ padding: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--admin-border)',
              marginBottom: '20px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 4px', color: 'var(--admin-text)' }}>
                Footer — Support & Legal Column
              </h3>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--admin-text-muted)' }}>
                Second navigation column in the website footer for customer care, orders, and policies.
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                setFooterContent((current) => ({
                  ...current,
                  supportLinks: [...current.supportLinks, { label: '', path: '', visible: true }],
                }))
              }
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} />
              <span>Add Support Link</span>
            </button>
          </div>

          <div style={{ marginBottom: '18px', maxWidth: '360px' }}>
            <FormField label="Column Header Title">
              <input
                type="text"
                value={footerContent.supportHeading}
                onChange={(e) =>
                  setFooterContent((current) => ({ ...current, supportHeading: e.target.value }))
                }
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gap: '14px' }}>
            {footerContent.supportLinks.map((link, index) => (
              <LinkRow
                key={`support-${index}`}
                link={link}
                index={index}
                total={footerContent.supportLinks.length}
                sectionPrefix="support"
                onChange={(rowIndex, field, value) =>
                  setFooterContent((current) => ({
                    ...current,
                    supportLinks: current.supportLinks.map((item, itemIndex) =>
                      itemIndex === rowIndex ? { ...item, [field]: value } : item
                    ),
                  }))
                }
                onRemove={(rowIndex) =>
                  setFooterContent((current) => ({
                    ...current,
                    supportLinks: current.supportLinks.filter((_, itemIndex) => itemIndex !== rowIndex),
                  }))
                }
                onMoveUp={(rowIndex) =>
                  moveLink(
                    (links) => setFooterContent((curr) => ({ ...curr, supportLinks: links })),
                    footerContent.supportLinks,
                    rowIndex,
                    -1
                  )
                }
                onMoveDown={(rowIndex) =>
                  moveLink(
                    (links) => setFooterContent((curr) => ({ ...curr, supportLinks: links })),
                    footerContent.supportLinks,
                    rowIndex,
                    1
                  )
                }
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default NavigationManager;
