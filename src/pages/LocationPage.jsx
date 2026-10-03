import React from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { formatCurrency } from '../data/store';
import { siteConfig } from '../config/siteConfig';

function LocationPage({ products = [] }) {
  const { city } = useParams();
  
  // Capitalize city name
  const cityName = city.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const bestSellers = products.slice(0, 4);

  return (
    <div className="page-stack">
      <SEO
        title={`Luxury Wooden Wall Clocks in ${cityName} | ${siteConfig.name}`}
        description={`Discover premium, handcrafted wooden wall clocks available for free delivery in ${cityName}. Elevate your home decor with our exclusive collection.`}
        path={`/locations/${city}`}
      />
      
      <section className="page-header-panel">
        <p className="label">Local Delivery</p>
        <h1>Luxury Wooden Wall Clocks in {cityName}</h1>
        <p className="hero-text">
          Elevate your interior with our premium, handcrafted timepieces. Enjoy complimentary express delivery anywhere in {cityName}.
        </p>
      </section>

      <section className="catalog-section">
        <div className="section-heading">
          <h2>Trending in {cityName}</h2>
        </div>
        <div className="product-grid related-product-grid">
          {bestSellers.map((product) => (
            <article className="product-card" key={product.id}>
              <Link className="product-image-link hover-zoom" to={`/products/${product.id}`}>
                <img src={product.hero} alt={product.name} loading="lazy" />
              </Link>
              <div className="product-card-copy">
                <div className="product-top">
                  <p className="label">{product.category}</p>
                </div>
                <h3>{product.name}</h3>
                <div className="product-bottom">
                  <div>
                    <strong>{formatCurrency(product.price)}</strong>
                  </div>
                  <Link className="secondary-btn" to={`/products/${product.id}`}>
                    View {product.name}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="catalog-section review-section" style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface-2)', borderRadius: '24px' }}>
        <h2>Why collectors in {cityName} choose {siteConfig.name}</h2>
        <div className="feature-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginTop: '40px' }}>
          <div>
            <h3>Free {cityName} Delivery</h3>
            <p>We safely package and ship your timepiece directly to your door at no extra cost.</p>
          </div>
          <div>
            <h3>Silent Movement</h3>
            <p>Our premium sweep-quartz mechanisms ensure absolutely silent operation.</p>
          </div>
          <div>
            <h3>Solid Wood Craft</h3>
            <p>Each clock is carved from a single piece of sustainably sourced hardwood.</p>
          </div>
        </div>
        <Link to="/shop" className="primary-btn" style={{ marginTop: '40px' }}>Shop The Collection</Link>
      </section>
    </div>
  );
}

export default LocationPage;
