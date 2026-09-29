import React from 'react';
import SEO from '../components/SEO';
import { siteConfig } from '../config/siteConfig';

function AboutPage({ siteContent }) {
  const aboutPageContent = siteContent?.aboutPageContent;

  return (
    <div className="page-stack">
      <SEO 
        title="The Atelier" 
        description={`Learn about the master artisans behind ${siteConfig.name}.`} 
      />
      <section className="page-header-panel">
        <p className="label">{aboutPageContent.eyebrow}</p>
        <h1>{aboutPageContent.title}</h1>
      </section>

      <section className="home-story">
        <div className="section-heading">
          <h2>{aboutPageContent.introHeadline}</h2>
          <p className="hero-text" style={{ marginTop: '14px', maxWidth: '800px' }}>
            {aboutPageContent.introBody}
          </p>
        </div>
        
        <div className="story-grid" style={{ marginTop: '32px' }}>
          {aboutPageContent.storyCards.map((card) => (
            <article key={card.title} className="story-card">
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="making-of-section" style={{ padding: '80px 0', borderTop: '1px solid var(--line)', marginTop: '48px' }}>
        <div className="section-heading" style={{ textAlign: 'center' }}>
          <p className="label">{aboutPageContent.makingOfEyebrow}</p>
          <h2>{aboutPageContent.makingOfHeadline}</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '48px' }}>
          {aboutPageContent.makingOfItems.map((step, i) => (
             <div key={`${step.title}-${i}`} className="hover-zoom" style={{ background: 'var(--surface-2)', borderRadius: '16px', overflow: 'hidden' }}>
               <div style={{ aspectRatio: '4/3' }}>
                 <img src={step.img} alt={step.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
               </div>
               <div style={{ padding: '24px' }}>
                 <h3>{step.title}</h3>
                 <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>{step.text}</p>
               </div>
             </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AboutPage;
