import React from 'react';
import { Link } from 'react-router-dom';
import { siteConfig } from '../config/siteConfig';

function SiteFooter({
  storeName = siteConfig.name,
  showJournal = false,
  footerContent = {},
}) {
  const exploreLinks = (footerContent?.exploreLinks || []).filter(
    (link) => link?.visible !== false && link?.label && link?.path && (link.path !== '/blog' || showJournal)
  );
  const supportLinks = (footerContent?.supportLinks || []).filter(
    (link) => link?.visible !== false && link?.label && link?.path
  );
  const instagramUrl = siteConfig.social?.instagram;

  return (
    <footer className="site-footer site-footer-v2">
      <div className="site-footer-shell">
        <div className="site-footer-brand">
          <Link to="/" className="brand-wordmark" aria-label={`${storeName} Home`}>
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

        <div className="site-footer-links">
          {exploreLinks.map((link) => (
            <Link key={link.path} to={link.path}>
              {link.label}
            </Link>
          ))}
          {supportLinks.map((link) => (
            <Link key={link.path} to={link.path}>
              {link.label}
            </Link>
          ))}
          {instagramUrl ? (
            <a href={instagramUrl} target="_blank" rel="noreferrer">
              Instagram
            </a>
          ) : null}
        </div>

        <div className="site-footer-meta">
          <span>&copy; {new Date().getFullYear()} {storeName}</span>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
