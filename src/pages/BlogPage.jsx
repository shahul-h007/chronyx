import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import SEO from '../components/SEO';
import { supabase } from '../lib/supabase';
import { fallbackArticles, formatArticleDate } from '../lib/journal';
import { siteConfig } from '../config/siteConfig';

function BlogPage() {
  const [articles, setArticles] = useState(fallbackArticles);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchArticles = async () => {
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('is_published', true)
          .order('published_at', { ascending: false });

        if (!error && data?.length && isMounted) {
          setArticles(data);
        }
      } catch (error) {
        console.error('Failed to load journal articles:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchArticles();

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredArticle = useMemo(
    () => articles.find((article) => article.is_featured) || articles[0] || null,
    [articles],
  );
  const secondaryArticles = useMemo(
    () => articles.filter((article) => !featuredArticle || article.slug !== featuredArticle.slug),
    [articles, featuredArticle],
  );

  return (
    <div className="page-stack">
      <SEO
        title="Journal"
        description={`Stories from ${siteConfig.name} on craft, wood, interiors, and the rituals of time.`}
        path="/blog"
      />
      <section className="page-header-panel">
        <p className="label">Journal</p>
        <h1>{siteConfig.name} Journal</h1>
      </section>

      {featuredArticle ? (
        <section className="journal-hero-panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {featuredArticle.cover_image && (
            <img 
              src={featuredArticle.cover_image} 
              alt={featuredArticle.title} 
              style={{ width: '100%', height: '380px', objectFit: 'cover' }}
              loading="eager"
            />
          )}
          <div className="journal-hero-copy" style={{ padding: '40px', maxWidth: '100%' }}>
            <p className="label">{formatArticleDate(featuredArticle.published_at)}</p>
            <h2>{featuredArticle.title}</h2>
            <p style={{ maxWidth: '720px' }}>{featuredArticle.excerpt}</p>
            <Link to={`/journal/${featuredArticle.slug}`} className="primary-btn" style={{ alignSelf: 'flex-start', marginTop: '16px' }}>
              Read Featured Story <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      ) : null}

      <section className="home-story">
        <div className="section-heading split-heading">
          <div>
            <h2>Stories on craft, design, and time.</h2>
            <p className="hero-text">
              {loading ? 'Loading journal entries...' : 'Read the ideas, materials, and interior stories behind the pieces.'}
            </p>
          </div>
        </div>

        <div className="story-grid journal-grid" style={{ marginTop: '24px' }}>
          {secondaryArticles.map((article) => (
            <article
              key={article.id}
              className="story-card journal-card"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 0, overflow: 'hidden' }}
            >
              {article.cover_image && (
                <Link to={`/journal/${article.slug}`}>
                  <img 
                    src={article.cover_image} 
                    alt={article.title} 
                    style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }} 
                    loading="lazy"
                  />
                </Link>
              )}
              <div style={{ padding: '24px' }}>
                <p className="label" style={{ marginBottom: '12px' }}>
                  {formatArticleDate(article.published_at)}
                </p>
                <h3>{article.title}</h3>
                <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>{article.excerpt}</p>
              </div>
              <div style={{ padding: '0 24px 24px 24px', marginTop: 'auto' }}>
                <Link to={`/journal/${article.slug}`} className="secondary-btn" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                  Read article <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default BlogPage;
