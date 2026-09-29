import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import SEO from '../components/SEO';
import { siteConfig } from '../config/siteConfig';

function ContactPage({ siteContent, storeSettings }) {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const contactPageContent = siteContent?.contactPageContent;
  const addressLines = (contactPageContent.studioAddress || '').split('\n').filter(Boolean);
  const resolvedSupportEmail =
    storeSettings?.contact_email || contactPageContent.supportEmail || siteConfig.contactEmail || 'hello@chronyx.in';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await supabase.from('contact_messages').insert([{ name, email, message }]);
      try {
        await supabase.functions.invoke('send-contact-email', {
          body: {
            name,
            email,
            message,
            supportEmail: resolvedSupportEmail,
          },
        });
      } catch (emailError) {
        console.error('Failed to send contact email:', emailError);
      }
    } catch (err) {
      console.error('Failed to save message:', err);
    }
    setSubmitted(true);
  };

  return (
    <div className="page-stack">
      <SEO
        title="Contact"
        description={`Contact ${siteConfig.name} for product questions, order help, or custom requests.`}
        path="/contact"
      />
      <section className="page-header-panel">
        <p className="label">{contactPageContent.eyebrow}</p>
        <h1>{contactPageContent.title}</h1>
      </section>

      <section className="checkout-layout">
        <div className="checkout-form-panel">
          <div className="section-heading">
            <h2>{contactPageContent.introHeadline}</h2>
            <p className="hero-text">{contactPageContent.introBody}</p>
          </div>

          {submitted ? (
            <div className="confirmation-panel" style={{ textAlign: 'left', padding: '24px' }}>
              <h3>{contactPageContent.successTitle}</h3>
              <p>{contactPageContent.successBody}</p>
            </div>
          ) : (
            <form className="form-grid" onSubmit={handleSubmit}>
              <label className="full-span">
                Name
                <input type="text" required placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="full-span">
                Email
                <input type="email" required placeholder="jane@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="full-span">
                Message
                <textarea required rows="5" placeholder="How can we help?" value={message} onChange={(e) => setMessage(e.target.value)}></textarea>
              </label>
              <button type="submit" className="primary-btn full-width-btn">
                Send Message
              </button>
            </form>
          )}
        </div>

        <div className="summary-panel">
          <h3>{contactPageContent.supportHeading}</h3>
          <p>{contactPageContent.supportBody}</p>
          <div style={{ marginTop: '24px' }}>
            <p className="label">Email</p>
            <strong>{resolvedSupportEmail}</strong>
          </div>
          <div style={{ marginTop: '16px' }}>
            <p className="label">Studio</p>
            <strong>
              {addressLines.map((line, index) => (
                <React.Fragment key={`${line}-${index}`}>
                  {line}
                  {index < addressLines.length - 1 ? <br /> : null}
                </React.Fragment>
              ))}
            </strong>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ContactPage;
