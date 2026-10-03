import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Plus,
  Trash,
  PencilSimple,
  Globe,
  FileText,
  CheckCircle,
  WarningCircle,
  X,
  MagnifyingGlass,
  Image as ImageIcon,
  GoogleLogo,
} from '@phosphor-icons/react';

import AdminPageHeader from '../components/common/AdminPageHeader';
import StatCard from '../components/common/StatCard';
import FormField from '../components/common/FormField';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';

const defaultOverrideForm = {
  id: '',
  path: '/',
  title: '',
  description: '',
  image: '',
};

export default function SEOManager() {
  const [overrides, setOverrides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [formData, setFormData] = useState(defaultOverrideForm);
  const [saving, setSaving] = useState(false);
  const [deletingTarget, setDeletingTarget] = useState(null);
  const [deletingId, setDeletingId] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchOverrides();
  }, []);

  const fetchOverrides = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('seo_overrides').select('*').order('path');
      if (error) throw error;
      setOverrides(data || []);
    } catch (error) {
      console.error('Error fetching SEO overrides:', error.message);
      setFeedback({ type: 'error', message: `Failed to load SEO overrides: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = overrides.length;
    const withTitle = overrides.filter((o) => (o.title || '').trim()).length;
    const withDesc = overrides.filter((o) => (o.description || '').trim()).length;
    return { total, withTitle, withDesc };
  }, [overrides]);

  const filteredOverrides = useMemo(() => {
    if (!searchQuery.trim()) return overrides;
    const q = searchQuery.toLowerCase();
    return overrides.filter(
      (o) =>
        (o.path || '').toLowerCase().includes(q) ||
        (o.title || '').toLowerCase().includes(q) ||
        (o.description || '').toLowerCase().includes(q)
    );
  }, [overrides, searchQuery]);

  const openNewEditor = () => {
    setFormData(defaultOverrideForm);
    setFormError('');
    setEditorOpen(true);
  };

  const openEditEditor = (override) => {
    setFormData({
      id: override.id,
      path: override.path || '/',
      title: override.title || '',
      description: override.description || '',
      image: override.image || '',
    });
    setFormError('');
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setFormData(defaultOverrideForm);
    setFormError('');
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.path.trim()) {
      setFormError('URL Path is required.');
      return;
    }

    let safePath = formData.path.trim();
    if (!safePath.startsWith('/')) safePath = '/' + safePath;

    setSaving(true);
    setFormError('');
    try {
      const payload = {
        path: safePath,
        title: formData.title.trim(),
        description: formData.description.trim(),
        image: formData.image.trim(),
        updated_at: new Date().toISOString(),
      };

      if (formData.id) {
        payload.id = formData.id;
      }

      const { error } = await supabase.from('seo_overrides').upsert(payload);
      if (error) throw error;

      await fetchOverrides();
      closeEditor();
      setFeedback({
        type: 'success',
        message: formData.id ? 'SEO override updated successfully.' : 'SEO override created successfully.',
      });
    } catch (error) {
      setFormError(`Error saving SEO override: ${error.message}. Ensure seo_overrides table exists in Supabase.`);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTarget) return;
    setDeletingId(deletingTarget.id);
    try {
      const { error } = await supabase.from('seo_overrides').delete().eq('id', deletingTarget.id);
      if (error) throw error;

      await fetchOverrides();
      setFeedback({ type: 'success', message: `SEO override for "${deletingTarget.path}" deleted.` });
      setDeletingTarget(null);
    } catch (error) {
      setFeedback({ type: 'error', message: `Error deleting SEO override: ${error.message}` });
    } finally {
      setDeletingId('');
    }
  };

  if (loading) {
    return (
      <div className="admin-page-container">
        <AdminPageHeader
          eyebrow="Search Engine Optimization"
          title="SEO Manager"
          description="Configure route-level Meta Titles, Descriptions, and OpenGraph tags."
        />
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
          Loading SEO configurations...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container" style={{ display: 'grid', gap: '24px' }}>
      <AdminPageHeader
        eyebrow="Search Engine Optimization"
        title="SEO Manager"
        description="Configure route-level Meta Titles, Descriptions, and social share cards for specific storefront URL routes."
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={openNewEditor}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} weight="bold" />
            <span>New Override</span>
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
          label="Active Overrides"
          value={stats.total}
          description="Routes with customized metadata"
          icon={Globe}
          tone="neutral"
        />
        <StatCard
          label="Custom Meta Titles"
          value={`${stats.withTitle} / ${stats.total}`}
          description="Routes with explicit titles"
          icon={FileText}
          tone="info"
        />
        <StatCard
          label="Descriptions Covered"
          value={`${stats.withDesc} / ${stats.total}`}
          description="Routes with search descriptions"
          icon={CheckCircle}
          tone="success"
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
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
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 2px', color: 'var(--admin-text)' }}>
              Route Metadata Overrides
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
              Overrides apply dynamically to the storefront for search engines and social scrapers.
            </p>
          </div>

          <div style={{ position: 'relative', width: '240px' }}>
            <MagnifyingGlass
              size={14}
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
              placeholder="Search by path or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px 6px 30px',
                fontSize: '0.84rem',
                borderRadius: 'var(--admin-radius-sm, 6px)',
                border: '1px solid var(--admin-border)',
                background: 'var(--admin-surface)',
                color: 'var(--admin-text)',
              }}
            />
          </div>
        </div>

        {filteredOverrides.length === 0 ? (
          <div style={{ padding: '40px 20px' }}>
            <EmptyState
              icon={Globe}
              title={searchQuery ? 'No matching overrides' : 'No SEO overrides configured'}
              description={
                searchQuery
                  ? `No routes match "${searchQuery}".`
                  : 'Inject custom meta titles, descriptions, and OpenGraph images for specific URL paths like /shop, /about, or /contact.'
              }
              action={
                searchQuery ? (
                  <button className="btn-secondary" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </button>
                ) : (
                  <button className="btn-primary" onClick={openNewEditor}>
                    <Plus size={16} /> New Override
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
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>URL Path</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Meta Title</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Meta Description</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>OG Image</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOverrides.map((override) => (
                  <tr
                    key={override.id}
                    style={{ borderBottom: '1px solid var(--admin-border)', transition: 'background 0.15s ease' }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <code
                        style={{
                          fontWeight: 600,
                          fontSize: '0.86rem',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'var(--admin-surface-hover)',
                          color: 'var(--admin-text)',
                        }}
                      >
                        {override.path}
                      </code>
                    </td>
                    <td style={{ padding: '14px 16px', maxWidth: '240px' }}>
                      <div style={{ fontWeight: 500, color: 'var(--admin-text)', fontSize: '0.88rem' }}>
                        {override.title || <span style={{ color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>Default template title</span>}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', maxWidth: '340px' }}>
                      <div
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--admin-text-muted)',
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {override.description || <span style={{ fontStyle: 'italic' }}>Default template description</span>}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {override.image ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.8rem',
                            color: 'var(--admin-success)',
                            fontWeight: 500,
                          }}
                        >
                          <ImageIcon size={14} /> Set
                        </span>
                      ) : (
                        <span style={{ color: 'var(--admin-text-subtle)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => openEditEditor(override)}
                          style={{ padding: '6px 10px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Edit override"
                        >
                          <PencilSimple size={14} />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setDeletingTarget(override)}
                          style={{
                            padding: '6px 10px',
                            fontSize: '0.82rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--admin-danger)',
                          }}
                          title="Delete override"
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

      {/* Override Editor Modal */}
      <Modal
        isOpen={editorOpen}
        onClose={closeEditor}
        title={formData.id ? 'Edit SEO Override' : 'New SEO Override'}
        maxWidth="640px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button type="button" className="btn-secondary" onClick={closeEditor} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : formData.id ? 'Save Changes' : 'Create Override'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSave} style={{ display: 'grid', gap: '16px' }}>
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

          <FormField
            label="URL Route Path"
            required
            hint="Specify relative route path, e.g. /shop, /about, or /contact"
            id="seo-path"
          >
            <input
              id="seo-path"
              type="text"
              name="path"
              value={formData.path}
              onChange={handleFieldChange}
              placeholder="/example-route"
              required
            />
          </FormField>

          <FormField
            label="Meta Title"
            hint={`Displayed on browser tab & search results (${(formData.title || '').length}/60 chars)`}
            id="seo-title"
          >
            <input
              id="seo-title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleFieldChange}
              placeholder="e.g. Shop Minimalist Wall Clocks | Chronyx"
            />
          </FormField>

          <FormField
            label="Meta Description"
            hint={`Search result snippet (${(formData.description || '').length}/160 chars)`}
            id="seo-desc"
          >
            <textarea
              id="seo-desc"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleFieldChange}
              placeholder="Explore handcrafted wooden clocks crafted with precision and sustainable hardwood..."
            />
          </FormField>

          <FormField
            label="OpenGraph Social Image URL"
            hint="Preview image displayed when URL is shared on WhatsApp, Twitter, LinkedIn"
            id="seo-img"
          >
            <input
              id="seo-img"
              type="text"
              name="image"
              value={formData.image}
              onChange={handleFieldChange}
              placeholder="https://..."
            />
          </FormField>

          {/* Search Result SERP Preview */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--admin-radius-md, 8px)',
              background: '#f8fafc',
              border: '1px solid var(--admin-border)',
            }}
          >
            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--admin-text-muted)',
                marginBottom: '8px',
              }}
            >
              Google Search Snippet Preview
            </div>
            <div style={{ fontFamily: 'Arial, sans-serif' }}>
              <div style={{ fontSize: '0.82rem', color: '#202124', marginBottom: '2px' }}>
                https://yourstore.com{formData.path || '/'}
              </div>
              <div style={{ fontSize: '1.05rem', color: '#1a0dab', fontWeight: 500, lineHeight: 1.3, marginBottom: '4px' }}>
                {formData.title || 'Page Title | Storefront Brand'}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#4d5156', lineHeight: 1.4 }}>
                {formData.description || 'Page meta description snippet will appear here in Google search engine result pages.'}
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(deletingTarget)}
        title="Delete SEO Override"
        message={`Are you sure you want to delete the SEO override for path "${deletingTarget?.path}"? The storefront will fall back to default metadata.`}
        confirmText="Delete Override"
        cancelText="Cancel"
        danger
        loading={deletingId === deletingTarget?.id}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingTarget(null)}
      />
    </div>
  );
}
