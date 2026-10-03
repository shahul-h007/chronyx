import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { siteConfig } from '../config/siteConfig';
import { buildBreadcrumbSchema } from '../lib/structuredData';

function PlacementGuidePage() {
  const schema = buildBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Guides', path: '/guides' },
    { name: 'Where to Hang a Wall Clock', path: '/guides/wall-clock-placement' },
  ]);

  return (
    <div className="page-stack">
      <SEO
        title="Where to Hang a Wall Clock | Placement Guide & Height Rules"
        description="Learn the ideal height and placement rules for hanging luxury wooden wall clocks in your living room, bedroom, or office."
        path="/guides/wall-clock-placement"
        schema={[schema]}
      />

      <section className="page-header-panel">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span className="breadcrumbs-current">Placement Guide</span>
        </nav>
        <p className="label">Interior Design Guide</p>
        <h1>Where to Hang a Wall Clock</h1>
        <p className="hero-text" style={{ maxWidth: '720px' }}>
          A luxury wall clock is more than just a timepiece; it acts as an anchor for your room's aesthetic. Discover the designer rules for height, placement, and lighting to make your clock a true focal point.
        </p>
      </section>

      <section className="journal-article-shell" style={{ marginTop: 0, borderTop: 'none', paddingTop: 0 }}>
        <div className="journal-article-body">
          <h2>1. The Ideal Height for a Wall Clock</h2>
          <p>
            The golden rule of interior design is to hang art and clocks at <strong>eye level</strong>. For most rooms, this means the center of the clock should sit roughly 57 to 60 inches from the floor. This allows the clock to be comfortably read without straining your neck.
          </p>
          <p>
            However, if you are hanging your clock above furniture, you must adjust this rule:
          </p>
          <ul>
            <li><strong>Above a sofa:</strong> Leave 8 to 12 inches of clearance between the top of the sofa and the bottom of the clock.</li>
            <li><strong>Above a fireplace mantel:</strong> Leave 4 to 6 inches of clearance to prevent the mantel decor from crowding the timepiece.</li>
          </ul>

          <h2>2. Living Room Placement</h2>
          <p>
            The living room is the most popular space for a <Link to="/shop">large wooden wall clock</Link>. The best placement is typically on the most prominent, unbroken wall or directly above the main seating area. If your living room has a fireplace, hanging the clock centrally above the mantel creates a classic, commanding focal point.
          </p>
          
          <h2>3. Bedroom Considerations: The Silent Movement</h2>
          <p>
            If you are placing a clock in a bedroom or a quiet study, ticking sounds can be highly disruptive. Always opt for a timepiece with a continuous sweep mechanism. You can explore our dedicated <Link to="/collections/silent-clocks">Silent Clocks Collection</Link> which features completely noiseless, premium quartz movements.
          </p>
          <p>
            In a bedroom, position the clock where it can be easily seen from the bed, but avoid placing it directly opposite a mirror, as reflections can create glare on the clock face.
          </p>

          <h2>4. Dining Room Elegance</h2>
          <p>
            In the dining room, a clock can add a touch of formality. Hang it on a side wall so diners can casually check the time without feeling rushed. A rich walnut or maple finish often pairs beautifully with wooden dining sets.
          </p>

          <div style={{ padding: '32px', background: 'var(--surface-2)', borderRadius: '16px', marginTop: '40px' }}>
            <h3>Looking for the perfect timepiece?</h3>
            <p>
              {siteConfig.name} clocks are crafted from sustainably sourced hardwoods and feature silent sweeping movements.
            </p>
            <div style={{ marginTop: '24px' }}>
              <Link to="/shop" className="primary-btn" style={{ display: 'inline-block' }}>
                Explore the Collection
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PlacementGuidePage;
