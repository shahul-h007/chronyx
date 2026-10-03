import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SEO from '../components/SEO';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../data/store';
import { siteConfig } from '../config/siteConfig';
import { fallbackArticles, findFallbackArticle, formatArticleDate } from '../lib/journal';
import { buildArticleSchema } from '../lib/structuredData';
import { sanitizeArticleHtml } from '../lib/sanitizeHtml';

function JournalArticlePage({ products = [] }) {
  const { slug } = useParams();
  const [article, setArticle] = useState(findFallbackArticle(slug) || fallbackArticles[0] || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchArticle = async () => {
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .maybeSingle();

        if (!error && data && isMounted) {
          setArticle(data);
        }
      } catch (error) {
        console.error('Failed to load journal article:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchArticle();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (!article) {
    return (
      <div className="page-stack">
        <section className="page-header-panel">
          <p className="label">Journal</p>
          <h1>Article not found</h1>
          <Link to="/blog" className="secondary-btn">Back to Journal</Link>
        </section>
      </div>
    );
  }

  // Get up to 3 featured products
  const featuredProducts = products.filter((p) => p.is_featured_home || p.stockQuantity > 0).slice(0, 3);
  const schema = buildArticleSchema(article);
  const sanitizedArticleContent = useMemo(() => sanitizeArticleHtml(article.content || ''), [article.content]);

  return (
    <div className="page-stack" style={{ paddingTop: 0 }}>
      <SEO
        title={article.seo_title || `${article.title} | ${siteConfig.name} Journal`}
        description={article.seo_description || article.excerpt}
        path={`/journal/${article.slug}`}
        schema={schema}
        image={article.cover_image}
      />
      
      {/* Full-bleed Editorial Hero */}
      <article 
        className="journal-editorial-hero"
        style={{
          position: 'relative',
          width: '100%',
          minHeight: article.cover_image ? '70vh' : 'auto',
          paddingTop: article.cover_image ? '0' : '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: article.cover_image ? '#000' : 'transparent',
          overflow: 'hidden'
        }}
      >
        {article.cover_image && (
          <>
            <img 
              src={article.cover_image} 
              alt={article.title} 
              style={{ 
                position: 'absolute',
                top: 0, left: 0, width: '100%', height: '100%', 
                objectFit: 'cover', opacity: 0.6 
              }} 
              loading="eager"
              fetchpriority="high"
            />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '50%', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }} />
          </>
        )}
        
        <div style={{ 
          position: 'relative', 
          zIndex: 10, 
          textAlign: 'center', 
          padding: '0 24px', 
          maxWidth: '900px',
          marginTop: article.cover_image ? '64px' : '0'
        }}>
          <p className="label" style={{ color: article.cover_image ? '#fff' : 'var(--text-secondary)' }}>Journal</p>
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 6vw, 5rem)', 
            lineHeight: 1, 
            marginBottom: '24px',
            color: article.cover_image ? '#fff' : 'var(--text)'
          }}>
            {article.title}
          </h1>
          <p className="hero-text" style={{ 
            color: article.cover_image ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)',
            fontSize: '1.1rem',
            margin: '0 auto 32px auto'
          }}>
            {article.excerpt}
          </p>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '16px', 
            color: article.cover_image ? 'rgba(255,255,255,0.6)' : 'var(--text-secondary)' 
          }}>
            <span>{loading ? 'Loading...' : formatArticleDate(article.published_at)}</span>
          </div>
        </div>
      </article>

      <div className="journal-article-body" style={{ marginTop: '64px', marginBottom: '80px', padding: '0 24px' }}>
        {/* Render article as raw HTML for SEO subheadings and inline links */}
        <div dangerouslySetInnerHTML={{ __html: sanitizedArticleContent }} />
      </div>

      {/* Embedded Commerce: Drive informational traffic to products */}
      {featuredProducts.length > 0 && (
        <section className="catalog-section" style={{ marginTop: '80px', borderTop: '1px solid var(--line)', paddingTop: '64px' }}>
          <div className="section-heading">
            <p className="label">Curated Selection</p>
            <h2>Featured Timepieces</h2>
          </div>
          <div className="product-grid related-product-grid">
            {featuredProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <Link className="product-image-link hover-zoom" to={`/products/${product.id}`}>
                  <img src={product.hero} alt={`${product.name} - Luxury Wooden Wall Clock`} loading="lazy" />
                </Link>
                <div className="product-card-copy">
                  <div className="product-top">
                    <p className="label">{product.category}</p>
                  </div>
                  <h3>{product.name}</h3>
                  <div className="product-bottom" style={{ marginTop: 'auto' }}>
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
      )}
    </div>
  );
}

export default JournalArticlePage;
