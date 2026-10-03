import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Cube, Gauge, MoonStars } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../data/store';
import SEO from '../components/SEO';
import { siteConfig } from '../config/siteConfig';
import { optimizeImage } from '../lib/optimizeImage';

function HomePage({ products = [], siteContent }) {
  const homepageContent = siteContent?.homepageContent || {};
  const aboutPageContent = siteContent?.aboutPageContent || {};
  const testimonials = homepageContent.testimonials || [];

  const [heroScale, setHeroScale] = useState(1);
  const [activeProcessIndex, setActiveProcessIndex] = useState(0);

  const heroProduct = products[0] || null;
  const featureProduct = products[1] || products[0] || null;
  const shopPreview = products.slice(0, 4);

  const fallbackHeroImage =
    heroProduct?.gallery?.find((image) => image && image !== heroProduct?.hero) ||
    heroProduct?.hero ||
    '';

  const fallbackFeatureImage =
    featureProduct?.gallery?.find((image) => image && image !== featureProduct?.hero) ||
    featureProduct?.hero ||
    fallbackHeroImage;

  const heroImage = homepageContent.heroImage || fallbackHeroImage;
  const signatureImage = homepageContent.signatureImage || heroProduct?.hero || fallbackHeroImage;
  const featureImage = homepageContent.secondaryFeatureImage || fallbackFeatureImage;

  useEffect(() => {
    const handleScroll = () => {
      const offset = Math.min(window.scrollY / 1400, 0.05);
      setHeroScale(1 + offset);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const processSteps = useMemo(
    () => {
      const makingOfItems = aboutPageContent?.makingOfItems || [];

      return [
        {
          label: 'Design',
          title: makingOfItems[0]?.title || 'Designing the silhouette',
          description:
            makingOfItems[0]?.text ||
            'Every clock begins as a proportion study where the dial, markers, and material tone are balanced for calm modern interiors.',
          image: homepageContent.processDesignImage || makingOfItems[0]?.img || heroImage,
        },
        {
          label: 'Material',
          title: makingOfItems[1]?.title || 'Selecting the material',
          description:
            makingOfItems[1]?.text ||
            'We choose timber and components for grain character, stability, and the quiet visual warmth the final piece should carry.',
          image: homepageContent.processMaterialImage || makingOfItems[1]?.img || featureImage || heroImage,
        },
        {
          label: 'Craft',
          title: makingOfItems[2]?.title || 'Precision shaping and assembly',
          description:
            makingOfItems[2]?.text ||
            'The body is cut, refined, and assembled with close attention to edge quality, movement fit, and how the piece sits in the room.',
          image: homepageContent.processCraftImage || makingOfItems[2]?.img || heroProduct?.hero || heroImage,
        },
        {
          label: 'Finish',
          title: 'Final finishing touches',
          description:
            'The last pass focuses on surface feel, tone balance, and a final quality check so the piece arrives ready to anchor the wall beautifully.',
          image:
            homepageContent.processFinishImage ||
            heroProduct?.gallery?.[1] ||
            featureProduct?.gallery?.[1] ||
            featureProduct?.hero ||
            heroImage,
        },
      ];
    },
    [
      aboutPageContent?.makingOfItems,
      featureImage,
      featureProduct?.gallery,
      featureProduct?.hero,
      heroImage,
      heroProduct?.gallery,
      heroProduct?.hero,
      homepageContent.processCraftImage,
      homepageContent.processDesignImage,
      homepageContent.processFinishImage,
      homepageContent.processMaterialImage,
    ],
  );

  const activeProcessStep = processSteps[activeProcessIndex] || processSteps[0];

  return (
    <div className="page-stack home-page home-page-v2">
      <SEO
        title="Luxury Wooden Wall Clocks"
        description={`Minimal wall clocks by ${siteConfig.name}. Quiet, premium, and designed to elevate modern spaces.`}
      />

      <section className="home-v2-hero">
        <div className="home-v2-hero-copy">
          <h1>Time, Framed Perfectly.</h1>
          <p>Minimal. Precise. Built to last.</p>
          <div className="hero-cta-group">
            <Link className="btn-primary" to="/shop">
              Explore Collection
            </Link>
            {heroProduct ? (
              <Link className="btn-secondary" to={`/products/${heroProduct.id}`}>
                Watch Design
              </Link>
            ) : null}
          </div>
        </div>

        {heroImage ? (
          <div className="home-v2-hero-visual">
            <div className="hero-product-stage" style={{ transform: `scale(${heroScale})` }}>
              <img src={optimizeImage(heroImage, 1200)} alt={heroProduct?.name || `${siteConfig.name} clock`} loading="eager" fetchpriority="high" width="1200" height="1500" style={{ width: '100%', height: 'auto', aspectRatio: '4/5', objectFit: 'cover' }} />
            </div>
          </div>
        ) : null}
      </section>

      {heroProduct ? (
        <section className="home-v2-feature home-v2-feature-primary">
          <div className="home-v2-shell home-v2-feature-grid">
            <div className="feature-copy">
              <p className="feature-kicker">Signature Piece</p>
              <h2>The {siteConfig.name} Core</h2>
              <p>
                A statement piece engineered for modern spaces.
              </p>
              <Link className="text-link" to={`/products/${heroProduct.id}`}>
                Explore {heroProduct.name} <ArrowRight size={16} />
              </Link>
            </div>
            <div className="feature-media">
              <img src={optimizeImage(signatureImage)} alt={heroProduct.name} loading="lazy" width="800" height="1000" style={{ width: '100%', height: 'auto', aspectRatio: '4/5', objectFit: 'cover' }} />
            </div>
          </div>
        </section>
      ) : null}

      {featureProduct ? (
        <section className="home-v2-feature home-v2-feature-secondary">
          <div className="home-v2-shell home-v2-feature-grid">
            <div className="feature-media">
              <img src={optimizeImage(featureImage)} alt={featureProduct.name} loading="lazy" width="800" height="1000" style={{ width: '100%', height: 'auto', aspectRatio: '4/5', objectFit: 'cover' }} />
            </div>
            <div className="feature-copy">
              <p className="feature-kicker">Material First</p>
              <h2>Natural Wood. Timeless Design.</h2>
              <p>
                Crafted from premium materials with precision detailing.
              </p>
              <Link className="text-link" to={`/products/${featureProduct.id}`}>
                View {featureProduct.name} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="home-v2-values">
        <div className="home-v2-shell home-v2-values-grid">
          <article className="value-item">
            <Cube size={24} weight="regular" />
            <h3>Minimal Design</h3>
            <p>Clean. Distraction-free.</p>
          </article>
          <article className="value-item">
            <Gauge size={24} weight="regular" />
            <h3>Premium Materials</h3>
            <p>Engineered wood &amp; fine finish.</p>
          </article>
          <article className="value-item">
            <MoonStars size={24} weight="regular" />
            <h3>Silent Movement</h3>
            <p>Zero noise. Pure focus.</p>
          </article>
        </div>
      </section>

      <section className="home-v2-statement">
        <p>Designed to elevate the way you experience time.</p>
      </section>

      {shopPreview.length > 0 ? (
        <section className="home-v2-shop-preview">
          <div className="home-v2-shell">
            <div className="section-heading home-v2-heading">
              <p className="label">Shop Preview</p>
              <h2>Discover the current collection.</h2>
            </div>

            <div className="home-v2-product-grid">
              {shopPreview.map((product) => (
                <Link key={product.id} className="home-v2-product-card" to={`/products/${product.id}`}>
                  <div className="home-v2-product-image">
                    <img src={optimizeImage(product.hero, 600)} alt={product.name} loading="lazy" width="600" height="750" style={{ width: '100%', height: 'auto', aspectRatio: '4/5', objectFit: 'cover' }} />
                  </div>
                  <div className="home-v2-product-copy">
                    <h3>{product.name}</h3>
                    <span>{formatCurrency(product.price)}</span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="home-v2-actions">
              <Link className="btn-secondary" to="/shop">
                View All Products
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="home-v2-process">
        <div className="home-v2-shell">
          <div className="section-heading home-v2-heading">
            <p className="label">Built With Precision</p>
            <h2>From first sketch to final finish.</h2>
          </div>

          <div className="process-flow">
            {processSteps.map((step, index) => (
              <button
                key={step.label}
                type="button"
                className={`process-step ${index === activeProcessIndex ? 'active' : ''}`}
                onClick={() => setActiveProcessIndex(index)}
              >
                <span>{step.label}</span>
              </button>
            ))}
          </div>

          <div className="process-stage">
            <div className="process-stage-copy">
              <p className="process-stage-kicker">{activeProcessStep.label}</p>
              <h3>{activeProcessStep.title}</h3>
              <p>{activeProcessStep.description}</p>
            </div>

            {activeProcessStep.image ? (
              <div className="process-image">
                <img src={optimizeImage(activeProcessStep.image, 1000)} alt={activeProcessStep.title} loading="lazy" width="1000" height="800" style={{ width: '100%', height: 'auto', aspectRatio: '5/4', objectFit: 'cover' }} />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {testimonials.length > 0 ? (
        <section className="home-v2-social-proof">
          <div className="home-v2-shell">
            <div className="home-v2-social-intro">
              <div className="section-heading home-v2-heading">
                <p className="label">Social Proof</p>
                <h2>Loved by creators and minimalists.</h2>
              </div>

              <div className="home-v2-social-copy">
                <p>
                  The calm silhouette, silent movement, and tactile finish are what make these pieces feel right at home in intentional spaces.
                </p>
                <div className="home-v2-social-stats">
                  <div>
                    <strong>4.9/5</strong>
                    <span>Average satisfaction</span>
                  </div>
                  <div>
                    <strong>{testimonials.length}+</strong>
                    <span>Featured collector notes</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="testimonial-row">
              {testimonials.slice(0, 3).map((testimonial) => (
                <article key={testimonial.author} className="testimonial-quote-card">
                  <span className="testimonial-mark">“</span>
                  <p>"{testimonial.quote}"</p>
                  <div className="testimonial-meta">
                    <strong>{testimonial.author}</strong>
                    {testimonial.location ? <span>{testimonial.location}</span> : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="home-v2-final-cta">
        <div className="final-cta-copy">
          <h2>Make Time Beautiful.</h2>
          <p>Bring {siteConfig.name} into your space.</p>
          <Link className="btn-primary btn-primary-light" to="/shop">
            Shop Now
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
