import React, { useEffect, useState, useMemo } from 'react';
import { Star } from '@phosphor-icons/react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatCurrency } from '../data/store';
import SEO from '../components/SEO';
import VideoPlayer from '../components/VideoPlayer';
import { supabase } from '../lib/supabase';
import {
  buildBreadcrumbSchema,
  buildProductSchema,
  buildProductVideoAsset,
  buildVideoObjectSchema,
} from '../lib/structuredData';
import { trackViewItem, trackAddToCart } from '../lib/tracking';

const GIFT_WRAP_PRICE = 500;

function ProductPage({ addToCart, products = [] }) {
  const { productId } = useParams();
  const navigate = useNavigate();
  const product = products.find((entry) => entry.id === productId) || products[0];

  const [activeImage, setActiveImage] = useState(product?.gallery?.[0] || '');
  const [timeLeft, setTimeLeft] = useState('');
  const [giftWrap, setGiftWrap] = useState(false);
  const [notice, setNotice] = useState('');
  const [productReviews, setProductReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    if (!product) return;
    setActiveImage(product.gallery?.[0] || '');
    setGiftWrap(false);
    trackViewItem(product);
    
    // Fetch dynamic reviews
    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const { data, error } = await supabase
          .from('product_reviews')
          .select('*')
          .eq('product_id', product.id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setProductReviews(data || []);
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setLoadingReviews(false);
      }
    };
    
    fetchReviews();
  }, [product]);

  const visibleReviews = useMemo(() => {
    const byCustomer = new Map();
    productReviews.forEach((review) => {
      const key = `${review.product_id}:${String(review.customer_email || review.customer_name || review.id).toLowerCase()}`;
      if (!byCustomer.has(key)) {
        byCustomer.set(key, review);
      }
    });
    return Array.from(byCustomer.values());
  }, [productReviews]);

  const reviewStats = useMemo(() => {
    if (visibleReviews.length === 0) return { avg: 5.0, count: 0 };
    const sum = visibleReviews.reduce((acc, rev) => acc + rev.rating, 0);
    return {
      avg: (sum / visibleReviews.length).toFixed(1),
      count: visibleReviews.length
    };
  }, [visibleReviews]);

  useEffect(() => {
    if (!product?.dropDate) return undefined;

    const dropTime = new Date(product.dropDate).getTime();
    const interval = window.setInterval(() => {
      const now = new Date().getTime();
      const distance = dropTime - now;

      if (distance < 0) {
        window.clearInterval(interval);
        setTimeLeft('DROP ENDED');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${days}d ${hours}h ${minutes}m`);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [product?.dropDate]);

  if (!product) {
    return (
      <div className="missing-state">
        <h2>Product not found</h2>
        <Link to="/shop" className="primary-btn">
          Back to Shop
        </Link>
      </div>
    );
  }

  const relatedProducts = products.filter((entry) => entry.id !== product.id).slice(0, 3);
  const handleAddToCart = () => {
    addToCart(product.id);
    trackAddToCart(product, 1);
    setNotice(`${product.name}${giftWrap ? ' (Gift Wrapped)' : ''} added to cart.`);
    window.setTimeout(() => setNotice(''), 3000);
  };

  const handleBuyNow = () => {
    addToCart(product.id);
    trackAddToCart(product, 1);
    navigate('/cart');
  };

  const videoAsset = buildProductVideoAsset(product);
  const schema = [
    buildProductSchema(product, reviewStats),
    buildBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Shop', path: '/shop' },
      { name: product.name, path: `/products/${product.id}` },
    ]),
    buildVideoObjectSchema(videoAsset, product),
  ].filter(Boolean);

  return (
    <div className="page-stack">
      <SEO
        title={`${product.name} | Luxury Wooden Wall Clock`}
        description={product.summary}
        schema={schema}
        path={`/products/${product.id}`}
        image={product.hero}
      />

      {notice ? <div className="notice-pill">{notice}</div> : null}

      <section className="product-page-hero">
        <div className="product-gallery">
          <div className="product-main-image">
            <img src={activeImage} alt={`${product.name} - Luxury ${product.category}`} loading="eager" fetchpriority="high" />
          </div>
          <div className="product-thumbs">
            {(product.gallery || []).map((image, idx) => (
              <button
                key={image}
                className={image === activeImage ? 'thumb-button active' : 'thumb-button'}
                onClick={() => setActiveImage(image)}
              >
                <img src={image} alt={`${product.name} detail view ${idx + 1}`} loading="lazy" />
              </button>
            ))}
          </div>
        </div>

        <div className="product-detail-panel">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/shop">Shop</Link>
            <span>/</span>
            <span className="breadcrumbs-current">{product.name}</span>
          </nav>

          <div className="product-heading-row">
            <div className="product-heading-copy">
              <p className="label">{product.category}</p>
              <h1>{product.name}</h1>
              <h2 className="product-tagline">{product.tagline}</h2>
            </div>
            {product.dropDate ? (
              <div className="badge limited-badge">
                <span>Limited Drop</span>
                <strong>{timeLeft}</strong>
              </div>
            ) : null}
          </div>

          <p className="product-long-copy">{product.story}</p>

          <div className="stock-row product-stock-row">
            <div className="battery-bar">
              <div style={{ width: `${product.stockLevelPercent || 0}%` }} />
            </div>
            <small>Only {product.stockQuantity || 0} items remaining</small>
          </div>

          <div className="spec-list">
            <div>
              <span>Price</span>
              <strong className="product-price-value">{formatCurrency(product.price)}</strong>
            </div>
            {Object.entries(product.attributes || {})
              .filter(([_, value]) => value != null && String(value).trim() !== '')
              .map(([key, value]) => (
                <div key={key}>
                  <span>{key}</span>
                  <strong>{String(value)}</strong>
                </div>
              ))}
          </div>

          <label className="gift-wrap-row" htmlFor="giftWrap">
            <input
              type="checkbox"
              id="giftWrap"
              checked={giftWrap}
              onChange={(event) => setGiftWrap(event.target.checked)}
            />
            <span>Add Premium Gift Wrapping (+{formatCurrency(GIFT_WRAP_PRICE)})</span>
          </label>

          {product.stockQuantity === 0 ? (
            <div className="waitlist-panel">
              <h3>This edition is sold out.</h3>
              <p>
                Join the waitlist to be notified instantly when our artisans finish the next
                batch.
              </p>
              <form
                className="waitlist-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  window.alert('Added to waitlist!');
                }}
              >
                <input type="email" placeholder="Email address" required />
                <button type="submit" className="primary-btn">
                  Notify Me
                </button>
              </form>
            </div>
          ) : (
            <div className="detail-actions">
              <button className="primary-btn" onClick={handleAddToCart}>
                Add to Cart
              </button>
              <button className="secondary-btn" onClick={handleBuyNow}>
                Buy Now
              </button>
            </div>
          )}

          {product.tags?.length ? (
            <div className="product-tags">
              <p className="label">Tags</p>
              <div className="tag-list">
                {product.tags.map((tag) => (
                  <span key={tag} className="tag-pill">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="product-extra-info">
        <div className="form-grid product-info-grid">
          <div className="info-block">
            <h3>Care Instructions</h3>
            <ul className="feature-list">
              {product.careInstructions?.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ul>
          </div>

          <div className="info-block">
            <h3>Key Features</h3>
            <ul className="feature-list">
              {(product.features || []).map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {videoAsset ? (
        <section className="product-video-section">
          <div className="section-heading centered-heading">
            <p className="label">Craft in Motion</p>
            <h2>{videoAsset.title}</h2>
            <p className="video-section-copy">{videoAsset.description}</p>
          </div>
          <VideoPlayer productId={product.id} video={videoAsset} />
        </section>
      ) : null}

      <section className="catalog-section review-section">
        <div className="section-heading">
          <p className="label">Client Reviews</p>
          <h2>Collector feedback</h2>
          <div className="review-summary">
            <span className="review-stars" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} size={15} weight={index < Math.round(reviewStats.avg) ? 'fill' : 'regular'} />
              ))}
            </span>
            <span>{reviewStats.avg}/5 ({reviewStats.count} {reviewStats.count === 1 ? 'review' : 'reviews'})</span>
          </div>
        </div>
        
        {loadingReviews ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>Loading reviews...</div>
        ) : visibleReviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', background: 'var(--surface-2)', borderRadius: '24px' }}>
            <p style={{ margin: 0 }}>This timepiece doesn't have any reviews yet. Verified purchasers can leave a review from their account.</p>
          </div>
        ) : (
          <div className="review-grid">
            {visibleReviews.map((review) => (
              <article key={review.id} className="review-card">
                <div className="review-card-stars">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={15} weight={index < review.rating ? 'fill' : 'regular'} />
                  ))}
                </div>
                {review.comment && <p>"{review.comment}"</p>}
                <strong>{review.customer_name}</strong>
              </article>
            ))}
          </div>
        )}
      </section>

      {relatedProducts.length > 0 ? (
        <section className="catalog-section">
          <div className="section-heading">
            <p className="label">More From CHRONYX</p>
            <h2>You might also like</h2>
          </div>
          <div className="product-grid related-product-grid">
            {relatedProducts.map((related) => (
              <article className="product-card" key={related.id}>
                <Link className="product-image-link hover-zoom" to={`/products/${related.id}`}>
                  <img src={related.hero} alt={related.name} loading="lazy" />
                </Link>
                <div className="product-card-copy">
                  <div className="product-top">
                    <p className="label">{related.category}</p>
                  </div>
                  <h3>{related.name}</h3>
                  <p>{related.summary}</p>
                  <div className="product-bottom">
                    <div>
                      <strong>{formatCurrency(related.price)}</strong>
                    </div>
                    <Link className="secondary-btn" to={`/products/${related.id}`}>
                      View {related.name}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default ProductPage;
