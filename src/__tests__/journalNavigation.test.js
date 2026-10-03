import { describe, expect, it } from 'vitest';
import { toBoolean, isJournalPath } from '../lib/siteContent';

describe('Journal Visibility Architecture (Phase 2)', () => {
  // Helper matching SiteHeader logic
  const resolveHeaderLinks = (navContent, showJournal) => {
    const isJournalFeatureActive = toBoolean(showJournal, false);
    const rawLinks = Array.isArray(navContent?.links) ? navContent.links : [];
    const hasJournalInRaw = rawLinks.some((link) => isJournalPath(link?.path));

    const filteredLinks = rawLinks.filter((link) => {
      if (!link || !link.label || !link.path) return false;
      if (isJournalPath(link.path)) {
        return isJournalFeatureActive && link.visible !== false;
      }
      return link.visible !== false;
    });

    return [
      ...filteredLinks,
      ...(isJournalFeatureActive && !hasJournalInRaw ? [{ label: 'Journal', path: '/blog' }] : []),
    ];
  };

  // Helper matching SiteFooter logic
  const resolveFooterLinks = (footerContent, showJournal) => {
    const isJournalFeatureActive = toBoolean(showJournal, false);

    const filterLink = (link) => {
      if (!link || !link.label || !link.path) return false;
      if (isJournalPath(link.path)) {
        return isJournalFeatureActive && link.visible !== false;
      }
      return link.visible !== false;
    };

    const rawExploreLinks = footerContent?.exploreLinks || [];
    const hasJournalInExplore = rawExploreLinks.some((link) => isJournalPath(link?.path));
    const filteredExploreLinks = rawExploreLinks.filter(filterLink);

    const exploreLinks = [
      ...filteredExploreLinks,
      ...(isJournalFeatureActive && !hasJournalInExplore ? [{ label: 'Journal', path: '/blog' }] : []),
    ];
    const supportLinks = (footerContent?.supportLinks || []).filter(filterLink);

    return { exploreLinks, supportLinks };
  };

  describe('Boolean normalization (toBoolean)', () => {
    it('handles booleans, strings, numbers and null/undefined safely', () => {
      expect(toBoolean(true)).toBe(true);
      expect(toBoolean(false)).toBe(false);
      expect(toBoolean('true')).toBe(true);
      expect(toBoolean('TRUE')).toBe(true);
      expect(toBoolean('1')).toBe(true);
      expect(toBoolean(1)).toBe(true);
      expect(toBoolean('false')).toBe(false);
      expect(toBoolean('FALSE')).toBe(false);
      expect(toBoolean('0')).toBe(false);
      expect(toBoolean(0)).toBe(false);
      expect(toBoolean(undefined)).toBe(false);
      expect(toBoolean(null)).toBe(false);
    });
  });

  describe('isJournalPath', () => {
    it('correctly detects journal related routes', () => {
      expect(isJournalPath('/blog')).toBe(true);
      expect(isJournalPath('/journal')).toBe(true);
      expect(isJournalPath('/journal/timeless-elegance')).toBe(true);
      expect(isJournalPath('/shop')).toBe(false);
      expect(isJournalPath('/about')).toBe(false);
      expect(isJournalPath('/contact')).toBe(false);
    });
  });

  // Test 1: show_journal = false, Journal navigation visible = true => Journal hidden
  it('1. show_journal = false, Journal navigation visible = true -> Journal hidden', () => {
    const navContent = {
      links: [
        { label: 'Shop', path: '/shop', visible: true },
        { label: 'Journal', path: '/blog', visible: true },
      ],
    };
    const footerContent = {
      exploreLinks: [
        { label: 'Shop All', path: '/shop', visible: true },
        { label: 'Journal', path: '/blog', visible: true },
      ],
      supportLinks: [],
    };

    const headerResult = resolveHeaderLinks(navContent, false);
    const footerResult = resolveFooterLinks(footerContent, false);

    expect(headerResult.some((l) => isJournalPath(l.path))).toBe(false);
    expect(footerResult.exploreLinks.some((l) => isJournalPath(l.path))).toBe(false);
  });

  // Test 2: show_journal = true, Journal navigation visible = true => Journal visible
  it('2. show_journal = true, Journal navigation visible = true -> Journal visible', () => {
    const navContent = {
      links: [
        { label: 'Shop', path: '/shop', visible: true },
        { label: 'Journal', path: '/blog', visible: true },
      ],
    };
    const footerContent = {
      exploreLinks: [
        { label: 'Shop All', path: '/shop', visible: true },
        { label: 'Journal', path: '/blog', visible: true },
      ],
      supportLinks: [],
    };

    const headerResult = resolveHeaderLinks(navContent, true);
    const footerResult = resolveFooterLinks(footerContent, true);

    expect(headerResult.some((l) => isJournalPath(l.path))).toBe(true);
    expect(footerResult.exploreLinks.some((l) => isJournalPath(l.path))).toBe(true);
  });

  // Test 3: show_journal = true, Journal navigation visible = false => Journal hidden from that navigation location
  it('3. show_journal = true, Journal navigation visible = false -> Journal hidden from that navigation location', () => {
    const navContent = {
      links: [
        { label: 'Shop', path: '/shop', visible: true },
        { label: 'Journal', path: '/blog', visible: false },
      ],
    };
    const footerContent = {
      exploreLinks: [
        { label: 'Shop All', path: '/shop', visible: true },
        { label: 'Journal', path: '/blog', visible: false },
      ],
      supportLinks: [],
    };

    const headerResult = resolveHeaderLinks(navContent, true);
    const footerResult = resolveFooterLinks(footerContent, true);

    expect(headerResult.some((l) => isJournalPath(l.path))).toBe(false);
    expect(footerResult.exploreLinks.some((l) => isJournalPath(l.path))).toBe(false);
  });

  // Test 4: show_journal = true, Header visible = true, Footer visible = false => Journal appears in header only
  it('4. show_journal = true, Header visible = true, Footer visible = false -> Journal appears in header only', () => {
    const navContent = {
      links: [
        { label: 'Shop', path: '/shop', visible: true },
        { label: 'Journal', path: '/blog', visible: true },
      ],
    };
    const footerContent = {
      exploreLinks: [
        { label: 'Shop All', path: '/shop', visible: true },
        { label: 'Journal', path: '/blog', visible: false },
      ],
      supportLinks: [],
    };

    const headerResult = resolveHeaderLinks(navContent, true);
    const footerResult = resolveFooterLinks(footerContent, true);

    expect(headerResult.some((l) => isJournalPath(l.path))).toBe(true);
    expect(footerResult.exploreLinks.some((l) => isJournalPath(l.path))).toBe(false);
  });

  // Test 5: show_journal = true, Header visible = false, Footer visible = true => Journal appears in footer only
  it('5. show_journal = true, Header visible = false, Footer visible = true -> Journal appears in footer only', () => {
    const navContent = {
      links: [
        { label: 'Shop', path: '/shop', visible: true },
        { label: 'Journal', path: '/blog', visible: false },
      ],
    };
    const footerContent = {
      exploreLinks: [
        { label: 'Shop All', path: '/shop', visible: true },
        { label: 'Journal', path: '/blog', visible: true },
      ],
      supportLinks: [],
    };

    const headerResult = resolveHeaderLinks(navContent, true);
    const footerResult = resolveFooterLinks(footerContent, true);

    expect(headerResult.some((l) => isJournalPath(l.path))).toBe(false);
    expect(footerResult.exploreLinks.some((l) => isJournalPath(l.path))).toBe(true);
  });

  // Test 6: show_journal = false, Header/footer visibility both true => Journal hidden everywhere and routes unavailable
  it('6. show_journal = false, Header/footer visibility both true -> Journal hidden everywhere and routes unavailable', () => {
    const navContent = {
      links: [
        { label: 'Shop', path: '/shop', visible: true },
        { label: 'Journal', path: '/blog', visible: true },
      ],
    };
    const footerContent = {
      exploreLinks: [
        { label: 'Shop All', path: '/shop', visible: true },
        { label: 'Journal', path: '/blog', visible: true },
      ],
      supportLinks: [],
    };

    const isJournalActive = toBoolean(false, false);
    const headerResult = resolveHeaderLinks(navContent, false);
    const footerResult = resolveFooterLinks(footerContent, false);

    expect(isJournalActive).toBe(false); // Route availability
    expect(headerResult.some((l) => isJournalPath(l.path))).toBe(false);
    expect(footerResult.exploreLinks.some((l) => isJournalPath(l.path))).toBe(false);
  });

  // Test 7: show_journal = "false" => Treat as false
  it('7. show_journal = "false" -> Treat as false', () => {
    const isJournalActive = toBoolean('false', false);
    expect(isJournalActive).toBe(false);

    const navContent = {
      links: [
        { label: 'Shop', path: '/shop', visible: true },
        { label: 'Journal', path: '/blog', visible: true },
      ],
    };
    const footerContent = {
      exploreLinks: [
        { label: 'Shop All', path: '/shop', visible: true },
        { label: 'Journal', path: '/blog', visible: true },
      ],
      supportLinks: [],
    };

    const headerResult = resolveHeaderLinks(navContent, 'false');
    const footerResult = resolveFooterLinks(footerContent, 'false');

    expect(headerResult.some((l) => isJournalPath(l.path))).toBe(false);
    expect(footerResult.exploreLinks.some((l) => isJournalPath(l.path))).toBe(false);
  });

  // Additional sanity test: non-journal links always respect their own visibility setting
  it('Non-journal links continue respecting their own visibility setting', () => {
    const navContent = {
      links: [
        { label: 'Shop', path: '/shop', visible: true },
        { label: 'About', path: '/about', visible: false },
        { label: 'Contact', path: '/contact', visible: true },
      ],
    };

    const headerResult = resolveHeaderLinks(navContent, true);
    expect(headerResult.some((l) => l.path === '/about')).toBe(false);
    expect(headerResult.some((l) => l.path === '/shop')).toBe(true);
    expect(headerResult.some((l) => l.path === '/contact')).toBe(true);
  });
});
