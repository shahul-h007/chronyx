import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Heart } from '@phosphor-icons/react';
import { formatCurrency } from '../data/store';
import SEO from '../components/SEO';
import { siteConfig } from '../config/siteConfig';
import { buildBreadcrumbSchema } from '../lib/structuredData';

function CollectionPage({ products = [], collections = [], addToCart, setNotice, toggleWishlist, wishlist = [] }) {
  const { slug } = useParams();

  const collection = useMemo(
    () => collections.find((c) => c.slug === slug),
    [collections, slug],
  );

  const [collectionProductIds, setCollectionProductIds] = useState([]);

  useEffect(() => {
    if (!collection) return;
    // Fetch product IDs for this collection from the join table
    import('../lib/supabase').then(({ supabase }) => {
      supabase
        .from('collection_products')
        .select('product_id')
        .eq('collection_id', collection.id)
        .order('sort_order', { ascending: true })
        .then(({ data }) => {
          setCollectionProductIds((data || []).map((row) => row.product_id));
        });
    });
  }, [collection]);

  const filteredProducts = useMemo(() => {
    if (collectionProductIds.length === 0) return [];
    return collectionProductIds
      .map((pid) => products.find((p) => p.id === pid))
      .filter(Boolean);
  }, [collectionProductIds, products]);

  if (!collection) {
    return (
      <div className="page-stack">
        <SEO title="Collection Not Found" description="This collection does not exist." noindex />
        <section className="page-header-panel">
          <p className="label">Collection</p>
          <h1>Collection not found</h1>
          <p className="hero-text">The collection you are looking for does not exist or has been removed.</p>
          <Link to="/shop" className="primary-btn" style={{ marginTop: '24px', display: 'inline-block' }}>
            Browse All Products
          </Link>
        </section>
      </div>
    );
  }

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: collection.title, path: `/collections/${collection.slug}` },
  ]);

  const seoTitle = `${collection.title} | Luxury Wall Clock Collection`;
  const seoDescription =
    collection.description ||
    `Shop the ${collection.title} collection of luxury wooden wall clocks by ${siteConfig.name}. Handcrafted with precision and timeless design.`;

  return (
    <div className="page-stack">
      <SEO
        title={seoTitle}
        description={seoDescription}
        schema={[breadcrumbSchema]}
        path={`/collections/${collection.slug}`}
        image={collection.image_url || undefined}
      />

      <section className="page-header-panel">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/shop">Shop</Link>
          <span>/</span>
          <span className="breadcrumbs-current">{collection.title}</span>
        </nav>
        <p className="label">Collection</p>
        <h1>{collection.title}</h1>
        {collection.subtitle && <h2 className="product-tagline">{collection.subtitle}</h2>}
        {collection.description && (
          <p className="hero-text" style={{ maxWidth: '680px' }}>
            {collection.description}
          </p>
        )}
      </section>

      <section className="catalog-section">
        {filteredProducts.length === 0 ? (
          <div className="empty-panel" style={{ padding: '64px', textAlign: 'center' }}>
            <h3>No products in this collection yet</h3>
            <p>Check back soon or browse our full catalog.</p>
            <Link to="/shop" className="secondary-btn" style={{ marginTop: '16px', display: 'inline-block' }}>
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <div style={{ position: 'relative' }}>
                  <Link className="product-image-link hover-zoom" to={`/products/${product.id}`}>
                    <img
                      src={product.hero}
                      alt={`${product.name} - ${collection.title} Collection by ${siteConfig.name}`}
                      loading="lazy"
                    />
                  </Link>
                  <button
                    className="icon-btn wishlist-floating-btn"
                    onClick={() => {
                      toggleWishlist(product.id);
                      setNotice(
                        wishlist.includes(product.id) ? 'Removed from wishlist' : 'Added to wishlist',
                      );
                    }}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'var(--surface)',
                      border: 'none',
                    }}
                  >
                    <Heart
                      size={20}
                      weight={wishlist.includes(product.id) ? 'fill' : 'regular'}
                      color={wishlist.includes(product.id) ? 'var(--accent)' : 'var(--text)'}
                    />
                  </button>
                </div>
                <div className="product-card-copy">
                  <div className="product-top">
                    <p className="label">{product.category}</p>
                    <span>{product.size}</span>
                  </div>
                  <h3>{product.name}</h3>
                  <p>{product.summary}</p>
                  <div className="stock-row">
                    <div className="battery-bar">
                      <div style={{ width: `${product.stockLevelPercent || 0}%` }} />
                    </div>
                    <small>Only {product.stockQuantity || 0} items remaining</small>
                  </div>
                  <div className="product-bottom" style={{ marginTop: 'auto' }}>
                    <div>
                      <strong>{formatCurrency(product.price)}</strong>
                    </div>
                    <div className="product-actions">
                      <button
                        className="primary-btn"
                        onClick={() => {
                          addToCart(product.id);
                          setNotice(`${product.name} added to cart.`);
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Cross-link back to other collections */}
      {collections.filter((c) => c.slug !== slug && c.is_visible).length > 0 && (
        <section className="catalog-section">
          <div className="section-heading">
            <p className="label">Explore More</p>
            <h2>Other Collections</h2>
          </div>
          <div className="collection-discovery-grid">
            {collections
              .filter((c) => c.slug !== slug && c.is_visible)
              .slice(0, 4)
              .map((col) => (
                <Link
                  key={col.id}
                  to={`/collections/${col.slug}`}
                  className="collection-discovery-card"
                >
                  {col.image_url && (
                    <img
                      src={col.image_url}
                      alt={`${col.title} collection - ${siteConfig.name} luxury wooden clocks`}
                      loading="lazy"
                    />
                  )}
                  <div className="collection-discovery-copy">
                    <h3>{col.title}</h3>
                    {col.subtitle && <p>{col.subtitle}</p>}
                  </div>
                </Link>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default CollectionPage;
