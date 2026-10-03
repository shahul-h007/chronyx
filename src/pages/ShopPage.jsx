import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatCurrency } from '../data/store';
import { Heart } from '@phosphor-icons/react';
import SEO from '../components/SEO';
import { siteConfig } from '../config/siteConfig';
import { optimizeImage } from '../lib/optimizeImage';

function ShopPage({ addToCart, setNotice, toggleWishlist, wishlist, products = [], collections = [] }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const showWishlistOnly = searchParams.get('wishlist') === 'true';
  const collectionSlug = searchParams.get('collection') || '';
  
  const [sortBy, setSortBy] = useState('featured');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterCollection, setFilterCollection] = useState(collectionSlug || 'All');
  const [isLoading, setIsLoading] = useState(true);

  // Fake network delay for skeleton loading
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [query, showWishlistOnly, filterCategory, filterCollection, sortBy]);

  const categories = ['All', ...new Set(products.map(p => p.category))];
  const collectionOptions = ['All', ...collections.filter(c => c.is_visible).map(c => c.slug)];
  const productCollectionMap = useMemo(() => {
    const map = new Map();
    collections.forEach((collection) => {
      (collection.collection_products || []).forEach((entry) => {
        if (!map.has(entry.product_id)) map.set(entry.product_id, []);
        map.get(entry.product_id).push(collection.slug);
      });
    });
    return map;
  }, [collections]);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (showWishlistOnly) {
      result = result.filter(p => wishlist.includes(p.id));
    }

    if (query) {
      const lowerQ = query.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(lowerQ) || 
        p.category.toLowerCase().includes(lowerQ) ||
        p.tags?.some(tag => tag.toLowerCase().includes(lowerQ))
      );
    }

    if (filterCategory !== 'All') {
      result = result.filter(p => p.category === filterCategory);
    }

    if (filterCollection !== 'All') {
      result = result.filter((p) => (productCollectionMap.get(p.id) || []).includes(filterCollection));
    }

    if (sortBy === 'price-low') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [query, showWishlistOnly, filterCategory, filterCollection, sortBy, wishlist, products, productCollectionMap]);

  useEffect(() => {
    setFilterCollection(collectionSlug || 'All');
  }, [collectionSlug]);

  return (
    <div className="page-stack">
      <SEO 
        title="Luxury Wooden Wall Clocks | The Full Collection" 
        description={`Shop the entire ${siteConfig.name} collection of luxury wooden wall clocks. Find the perfect minimalist, silent timepiece for your home or office.`} 
        path="/shop"
        noindex={searchParams.toString().length > 0}
      />
      <section className="page-header-panel">
        <p className="label">{showWishlistOnly ? 'Your Saved Items' : 'Collection'}</p>
        <h1>{showWishlistOnly ? 'Wishlist' : (query ? `Search: ${query}` : 'All Products')}</h1>
      </section>

      <section className="catalog-section">
        {!showWishlistOnly && (
          <div className="shop-controls" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div className="filter-group shop-filter-category">
              <label htmlFor="categoryFilter" className="label" style={{ marginRight: '8px' }}>Category:</label>
              <select 
                id="categoryFilter" 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--text)', padding: '6px 12px', borderRadius: '8px' }}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="filter-group shop-filter-collection">
              <label htmlFor="collectionFilter" className="label" style={{ marginRight: '8px' }}>Collection:</label>
              <select
                id="collectionFilter"
                value={filterCollection}
                onChange={(e) => {
                  const next = e.target.value;
                  setFilterCollection(next);
                  const nextParams = new URLSearchParams(searchParams);
                  if (next === 'All') nextParams.delete('collection');
                  else nextParams.set('collection', next);
                  setSearchParams(nextParams);
                }}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--text)', padding: '6px 12px', borderRadius: '8px' }}
              >
                {collectionOptions.map((slug) => (
                  <option key={slug} value={slug}>
                    {slug === 'All' ? 'All Collections' : collections.find((collection) => collection.slug === slug)?.title || slug}
                  </option>
                ))}
              </select>
            </div>
            <div className="sort-group shop-filter-sort">
              <label htmlFor="sortFilter" className="label" style={{ marginRight: '8px' }}>Sort by:</label>
              <select 
                id="sortFilter" 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--text)', padding: '6px 12px', borderRadius: '8px' }}
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="product-grid">
            {[1, 2, 3].map(n => (
              <article className="product-card skeleton" key={n} style={{ minHeight: '400px', background: 'var(--surface-3)', borderRadius: '18px', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-panel" style={{ padding: '64px', textAlign: 'center' }}>
            <h3>No products found</h3>
            <p>Try adjusting your search or filters.</p>
            {(query || showWishlistOnly || filterCategory !== 'All') && (
              <button 
                className="secondary-btn" 
                style={{ marginTop: '16px', display: 'inline-block' }}
                onClick={() => {
                  setSearchParams({});
                  setFilterCategory('All');
                  setFilterCollection('All');
                }}
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <div style={{ position: 'relative' }}>
                  <Link className="product-image-link hover-zoom" to={`/products/${product.id}`}>
                    <img src={optimizeImage(product.hero)} alt={`${product.name} - Luxury ${product.category} Wall Clock`} loading="lazy" width="800" height="1000" style={{ width: '100%', height: 'auto', aspectRatio: '4/5', objectFit: 'cover' }} />
                  </Link>
                  <button 
                    className="icon-btn wishlist-floating-btn"
                    onClick={() => {
                      toggleWishlist(product.id);
                      setNotice(wishlist.includes(product.id) ? 'Removed from wishlist' : 'Added to wishlist');
                    }}
                    style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--surface)', border: 'none' }}
                  >
                    <Heart size={20} weight={wishlist.includes(product.id) ? 'fill' : 'regular'} color={wishlist.includes(product.id) ? 'var(--accent)' : 'var(--text)'} />
                  </button>
                </div>
                <div className="product-card-copy">
                  <div className="product-top">
                    <p className="label">{product.category}</p>
                    <span>{product.size}</span>
                  </div>
                  <h3>{product.name}</h3>
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
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Browse Collections Discovery Block */}
      {collections.filter(c => c.is_visible).length > 0 && (
        <section className="catalog-section">
          <div className="section-heading">
            <p className="label">Shop by Collection</p>
            <h2>Browse Our Collections</h2>
          </div>
          <div className="collection-discovery-grid">
            {collections
              .filter(c => c.is_visible)
              .slice(0, 4)
              .map(col => (
                <Link
                  key={col.id}
                  to={`/collections/${col.slug}`}
                  className="collection-discovery-card"
                  aria-label={`Browse the ${col.title} collection`}
                >
                  {col.image_url && (
                    <img
                      src={optimizeImage(col.image_url)}
                      alt={`${col.title} - ${siteConfig.name} luxury wooden wall clock collection`}
                      loading="lazy"
                      width="800"
                      height="800"
                      style={{ width: '100%', height: 'auto', aspectRatio: '1/1', objectFit: 'cover' }}
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

export default ShopPage;
