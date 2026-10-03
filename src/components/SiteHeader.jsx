import React, { useEffect, useState } from 'react';
import { List, ShoppingBagOpen, X } from '@phosphor-icons/react';
import { Link, useLocation } from 'react-router-dom';
import { siteConfig } from '../config/siteConfig';
import { toBoolean, isJournalPath } from '../lib/siteContent';

const fallbackNavigationLinks = [
  { label: 'Shop', path: '/shop', visible: true },
  { label: 'About', path: '/about', visible: true },
  { label: 'Contact', path: '/contact', visible: true },
  { label: 'Journal', path: '/blog', visible: true },
];

function SiteHeader({
  cartCount,
  notice,
  setNotice,
  storeName = siteConfig.name,
  user = null,
  showJournal = false,
  navContent = null,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  const isJournalFeatureActive = toBoolean(showJournal, false);

  const rawLinks = Array.isArray(navContent?.links) && navContent.links.length > 0
    ? navContent.links
    : fallbackNavigationLinks;

  const hasJournalInRaw = rawLinks.some((link) => isJournalPath(link?.path));

  const filteredLinks = rawLinks.filter((link) => {
    if (!link || !link.label || !link.path) return false;
    if (isJournalPath(link.path)) {
      return isJournalFeatureActive && link.visible !== false;
    }
    return link.visible !== false;
  });

  const navigationLinks = [
    ...filteredLinks,
    ...(isJournalFeatureActive && !hasJournalInRaw ? [{ label: 'Journal', path: '/blog' }] : []),
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header className={`site-header site-header-v2 ${isScrolled ? 'scrolled' : 'top'}`}>
        <div className="header-left">
          <Link className="brand-wordmark" to="/" aria-label={`${storeName} Home`}>
            <img
              className="brand-mark"
              src={siteConfig.branding.mark}
              alt=""
              width="40"
              height="40"
              aria-hidden="true"
            />
            <span>{storeName}</span>
          </Link>
        </div>

        <div className="header-center" />

        <div className="header-right">
          <nav className="site-nav desktop-nav">
            {navigationLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            <Link
              className="account-link"
              to={user ? '/account' : '/auth'}
              aria-label={user ? 'My Account' : 'Sign In'}
            >
              <span>{user ? 'Account' : 'Sign In'}</span>
            </Link>
            <Link className="cart-link" to="/cart" aria-label="Cart">
              <ShoppingBagOpen size={18} />
              <span>{cartCount}</span>
            </Link>
          </div>
        </div>

        <div className="header-mobile-actions">
          <button
            className="icon-btn mobile-only hamburger"
            onClick={() => setIsMenuOpen((current) => !current)}
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {isMenuOpen ? <X size={18} /> : <List size={18} />}
          </button>
        </div>
      </header>

      {isMenuOpen ? (
        <div className="mobile-nav-panel">
          <nav className="site-nav mobile-nav">
            {navigationLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                {link.label}
              </Link>
            ))}
            <Link to={user ? '/account' : '/auth'}>
              {user ? 'Account' : 'Sign In'}
            </Link>
          </nav>
        </div>
      ) : null}

      {notice ? (
        <button className="notice-pill" onClick={() => setNotice('')}>
          {notice}
        </button>
      ) : null}
    </>
  );
}

export default SiteHeader;
