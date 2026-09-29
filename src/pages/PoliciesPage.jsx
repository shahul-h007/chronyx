import React from 'react';
import SEO from '../components/SEO';
import { siteConfig } from '../config/siteConfig';

function PoliciesPage({ siteContent }) {
  const policyContent = siteContent?.policyContent;

  const renderParagraphs = (value) =>
    String(value || '')
      .split('\n\n')
      .filter(Boolean)
      .map((paragraph, index, arr) => (
        <React.Fragment key={index}>
          {paragraph}
          {index < arr.length - 1 ? (
            <>
              <br />
              <br />
            </>
          ) : null}
        </React.Fragment>
      ));

  return (
    <div className="page-stack">
      <SEO
        title="Store Policies"
        description={`Refund, return, shipping, and privacy policies for ${siteConfig.name}.`}
      />
      <section className="page-header-panel">
        <p className="label">Legal</p>
        <h1>Store Policies</h1>
      </section>

      <section
        className="story-grid"
        style={{ maxWidth: '800px', margin: '0 auto', gap: '48px', display: 'flex', flexDirection: 'column' }}
      >
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>Privacy Policy</h2>
          <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>{renderParagraphs(policyContent.privacy)}</p>
        </div>

        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>Terms &amp; Conditions</h2>
          <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>{renderParagraphs(policyContent.terms)}</p>
        </div>

        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>Refund &amp; Return Policy</h2>
          <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>{renderParagraphs(policyContent.refund)}</p>
        </div>

        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>Shipping Policy</h2>
          <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>{renderParagraphs(policyContent.shipping)}</p>
        </div>
      </section>
    </div>
  );
}

export default PoliciesPage;
