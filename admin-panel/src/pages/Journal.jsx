import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  PencilSimple,
  Trash,
  Article,
  CheckCircle,
  WarningCircle,
  X,
  MagnifyingGlass,
  Star,
  CalendarBlank,
  Eye,
} from '@phosphor-icons/react';
import { supabase } from '../lib/supabase';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import AdminPageHeader from '../components/common/AdminPageHeader';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import ToggleSwitch from '../components/common/ToggleSwitch';
import FormField from '../components/common/FormField';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';

const defaultPostForm = {
  id: '',
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image: '',
  seo_title: '',
  seo_description: '',
  is_published: false,
  is_featured: false,
  published_at: '',
};

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const Journal = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingPost, setDeletingPost] = useState(null);
  const [deletingId, setDeletingId] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [formData, setFormData] = useState(defaultPostForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [feedback, setFeedback] = useState(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching blog posts:', error.message);
      setFeedback({ type: 'error', message: `Failed to load posts: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = posts.length;
    const published = posts.filter((post) => post.is_published).length;
    const featured = posts.filter((post) => post.is_featured).length;
    const drafts = total - published;
    return { total, published, featured, drafts };
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch =
        !searchQuery.trim() ||
        (post.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.slug || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' && post.is_published) ||
        (statusFilter === 'draft' && !post.is_published) ||
        (statusFilter === 'featured' && post.is_featured);

      return matchesSearch && matchesStatus;
    });
  }, [posts, searchQuery, statusFilter]);

  const openNewEditor = () => {
    setFormData(defaultPostForm);
    setFormError('');
    setEditorOpen(true);
  };

  const openEditEditor = (post) => {
    setFormData({
      id: post.id,
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      cover_image: post.cover_image || '',
      seo_title: post.seo_title || '',
      seo_description: post.seo_description || '',
      is_published: Boolean(post.is_published),
      is_featured: Boolean(post.is_featured),
      published_at: post.published_at ? new Date(post.published_at).toISOString().slice(0, 16) : '',
    });
    setFormError('');
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setFormData(defaultPostForm);
    setFormError('');
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      if (name === 'title' && !prev.id) {
        next.slug = slugify(value);
      }

      return next;
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Article title is required.');
      return;
    }
    if (!formData.slug.trim()) {
      setFormError('Article slug is required.');
      return;
    }
    if (!formData.excerpt.trim()) {
      setFormError('Article excerpt is required.');
      return;
    }
    if (!formData.content.trim() || formData.content === '<p><br></p>') {
      setFormError('Article body content cannot be empty.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const payload = {
        title: formData.title.trim(),
        slug: slugify(formData.slug),
        excerpt: formData.excerpt.trim(),
        content: formData.content.trim(),
        cover_image: formData.cover_image.trim(),
        seo_title: formData.seo_title.trim(),
        seo_description: formData.seo_description.trim(),
        is_published: formData.is_published,
        is_featured: formData.is_featured,
        published_at: formData.published_at ? new Date(formData.published_at).toISOString() : null,
      };

      if (formData.id) {
        payload.id = formData.id;
      }

      const { error } = await supabase.from('blog_posts').upsert(payload);
      if (error) throw error;

      await fetchPosts();
      closeEditor();
      setFeedback({
        type: 'success',
        message: formData.id ? 'Journal article updated successfully.' : 'Journal article created successfully.',
      });
    } catch (error) {
      setFormError(`Error saving article: ${error.message}. Ensure blog_posts table exists in Supabase.`);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPost) return;
    setDeletingId(deletingPost.id);
    try {
      const { error } = await supabase.from('blog_posts').delete().eq('id', deletingPost.id);
      if (error) throw error;

      await fetchPosts();
      setFeedback({ type: 'success', message: `Article "${deletingPost.title}" deleted.` });
      setDeletingPost(null);
    } catch (error) {
      setFeedback({ type: 'error', message: `Error deleting article: ${error.message}` });
    } finally {
      setDeletingId('');
    }
  };

  if (loading) {
    return (
      <div className="admin-page-container">
        <AdminPageHeader
          eyebrow="Editorial"
          title="Journal Manager"
          description="Create, edit, publish, and feature editorial journal articles that feed the storefront."
        />
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
          Loading journal articles...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container" style={{ display: 'grid', gap: '24px' }}>
      <AdminPageHeader
        eyebrow="Editorial"
        title="Journal Manager"
        description="Create, edit, publish, and feature editorial journal articles that feed the customer-facing journal."
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={openNewEditor}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} weight="bold" />
            <span>New Article</span>
          </button>
        }
      />

      {feedback && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: 'var(--admin-radius-md, 8px)',
            fontSize: '0.9rem',
            background: feedback.type === 'error' ? 'var(--admin-danger-subtle)' : 'var(--admin-success-subtle)',
            color: feedback.type === 'error' ? 'var(--admin-danger)' : 'var(--admin-success)',
            border: `1px solid ${feedback.type === 'error' ? 'var(--admin-danger)' : 'var(--admin-success)'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {feedback.type === 'error' ? <WarningCircle size={18} /> : <CheckCircle size={18} />}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '4px' }}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Articles"
          value={stats.total}
          description="Total editorial posts"
          icon={Article}
          tone="neutral"
        />
        <StatCard
          label="Published Live"
          value={stats.published}
          description={`${stats.drafts} unpublished draft(s)`}
          icon={Eye}
          tone="success"
        />
        <StatCard
          label="Featured Lead"
          value={stats.featured}
          description="Prioritized in journal hero"
          icon={Star}
          tone="info"
        />
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--admin-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Status Tabs */}
          <div style={{ display: 'inline-flex', gap: '6px', background: 'var(--admin-surface-hover)', padding: '4px', borderRadius: 'var(--admin-radius-sm, 6px)', border: '1px solid var(--admin-border)' }}>
            {[
              { id: 'all', label: `All (${stats.total})` },
              { id: 'published', label: `Published (${stats.published})` },
              { id: 'draft', label: `Drafts (${stats.drafts})` },
              { id: 'featured', label: `Featured (${stats.featured})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  border: 'none',
                  background: statusFilter === tab.id ? 'var(--admin-surface)' : 'transparent',
                  color: statusFilter === tab.id ? 'var(--admin-text)' : 'var(--admin-text-muted)',
                  fontWeight: statusFilter === tab.id ? 600 : 400,
                  boxShadow: statusFilter === tab.id ? 'var(--admin-shadow-sm)' : 'none',
                  padding: '6px 12px',
                  borderRadius: 'var(--admin-radius-sm, 4px)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', width: '260px' }}>
            <MagnifyingGlass
              size={16}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--admin-text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px 7px 32px',
                fontSize: '0.85rem',
                borderRadius: 'var(--admin-radius-sm, 6px)',
                border: '1px solid var(--admin-border)',
                background: 'var(--admin-surface)',
                color: 'var(--admin-text)',
              }}
            />
          </div>
        </div>

        {filteredPosts.length === 0 ? (
          <div style={{ padding: '40px 20px' }}>
            <EmptyState
              icon={Article}
              title={searchQuery || statusFilter !== 'all' ? 'No matching articles' : 'No journal articles yet'}
              description={
                searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search query or status filter to see other posts.'
                  : 'Start writing journal stories, craft articles, and updates for your customer audience.'
              }
              action={
                searchQuery || statusFilter !== 'all' ? (
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                  >
                    Reset Filters
                  </button>
                ) : (
                  <button className="btn-primary" onClick={openNewEditor}>
                    <Plus size={16} /> Write First Article
                  </button>
                )
              }
            />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="marketing-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--admin-surface-hover)', borderBottom: '1px solid var(--admin-border)' }}>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Article</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Slug</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Featured</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Published Date</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((post) => (
                  <tr
                    key={post.id}
                    style={{ borderBottom: '1px solid var(--admin-border)', transition: 'background 0.15s ease' }}
                  >
                    <td style={{ padding: '14px 16px', maxWidth: '320px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--admin-text)', fontSize: '0.92rem' }}>{post.title}</div>
                      {post.excerpt && (
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--admin-text-muted)',
                            marginTop: '2px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {post.excerpt}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <code style={{ fontSize: '0.82rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--admin-surface-hover)', color: 'var(--admin-text-muted)' }}>
                        {post.slug}
                      </code>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <StatusBadge status={post.is_published ? 'success' : 'neutral'}>
                        {post.is_published ? 'Published' : 'Draft'}
                      </StatusBadge>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {post.is_featured ? (
                        <StatusBadge status="info">Featured</StatusBadge>
                      ) : (
                        <span style={{ color: 'var(--admin-text-subtle)', fontSize: '0.85rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                      {post.published_at ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <CalendarBlank size={14} />
                          {new Date(post.published_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span>Not scheduled</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => openEditEditor(post)}
                          style={{ padding: '6px 10px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Edit article"
                        >
                          <PencilSimple size={14} />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setDeletingPost(post)}
                          style={{
                            padding: '6px 10px',
                            fontSize: '0.82rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--admin-danger)',
                          }}
                          title="Delete article"
                        >
                          <Trash size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Article Editor Modal */}
      <Modal
        isOpen={editorOpen}
        onClose={closeEditor}
        title={formData.id ? 'Edit Journal Article' : 'Write Journal Article'}
        maxWidth="860px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button type="button" className="btn-secondary" onClick={closeEditor} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : formData.id ? 'Save Changes' : 'Publish Article'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSave} style={{ display: 'grid', gap: '18px' }}>
          {formError && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--admin-radius-sm, 6px)',
                background: 'var(--admin-danger-subtle)',
                color: 'var(--admin-danger)',
                border: '1px solid var(--admin-danger)',
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <WarningCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <FormField label="Article Title" required id="post-title">
              <input
                id="post-title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. The Craft of Steam Bending Oak"
                required
              />
            </FormField>

            <FormField label="URL Slug" required hint="Unique web address identifier" id="post-slug">
              <input
                id="post-slug"
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="e.g. craft-of-steam-bending-oak"
                required
              />
            </FormField>
          </div>

          <FormField label="Short Excerpt" required hint="Appears in article previews and cards" id="post-excerpt">
            <textarea
              id="post-excerpt"
              rows={2}
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              placeholder="A concise summary introducing the reader to the story..."
              required
            />
          </FormField>

          <div>
            <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--admin-text)', display: 'block', marginBottom: '6px' }}>
              Article Body Content <span style={{ color: 'var(--admin-danger)' }}>*</span>
            </label>
            <div
              style={{
                borderRadius: 'var(--admin-radius-md, 8px)',
                overflow: 'hidden',
                border: '1px solid var(--admin-border)',
                background: '#fff',
              }}
            >
              <ReactQuill
                theme="snow"
                value={formData.content}
                onChange={(value) => setFormData((prev) => ({ ...prev, content: value }))}
                style={{ height: '240px', marginBottom: '44px', color: '#0f172a' }}
              />
            </div>
          </div>

          <FormField label="Cover Image URL" hint="Hero banner image for the article" id="post-cover">
            <input
              id="post-cover"
              type="text"
              name="cover_image"
              value={formData.cover_image}
              onChange={handleChange}
              placeholder="https://..."
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <FormField label="SEO Meta Title" hint="Overrides article title in search results" id="post-seo-title">
              <input
                id="post-seo-title"
                type="text"
                name="seo_title"
                value={formData.seo_title}
                onChange={handleChange}
                placeholder="e.g. The Craft of Steam Bending Oak | Chronyx Journal"
              />
            </FormField>

            <FormField label="Publication Date / Schedule" hint="When the article is marked published" id="post-published-at">
              <input
                id="post-published-at"
                type="datetime-local"
                name="published_at"
                value={formData.published_at}
                onChange={handleChange}
              />
            </FormField>
          </div>

          <FormField label="SEO Meta Description" hint="Snippet shown in Google and social sharing" id="post-seo-desc">
            <textarea
              id="post-seo-desc"
              rows={2}
              name="seo_description"
              value={formData.seo_description}
              onChange={handleChange}
              placeholder="Explore the delicate woodworking techniques behind creating curved clock casings..."
            />
          </FormField>

          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--admin-radius-md, 8px)',
              background: 'var(--admin-surface-hover)',
              border: '1px solid var(--admin-border)',
              display: 'grid',
              gap: '14px',
            }}
          >
            <ToggleSwitch
              label="Publish to Storefront"
              description="Make this article immediately live and readable by visitors"
              checked={formData.is_published}
              onChange={(val) => setFormData((prev) => ({ ...prev, is_published: val }))}
            />
            <div style={{ height: '1px', background: 'var(--admin-border)' }} />
            <ToggleSwitch
              label="Feature in Journal Hero"
              description="Promote this story as the lead showcase piece on the journal index"
              checked={formData.is_featured}
              onChange={(val) => setFormData((prev) => ({ ...prev, is_featured: val }))}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(deletingPost)}
        title="Delete Journal Article"
        message={`Are you sure you want to delete "${deletingPost?.title}"? This action cannot be undone.`}
        confirmText="Delete Article"
        cancelText="Cancel"
        danger
        loading={deletingId === deletingPost?.id}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingPost(null)}
      />
    </div>
  );
};

export default Journal;
