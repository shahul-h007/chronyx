import { useEffect, useMemo, useState } from 'react';
import {
  Folder,
  House,
  Storefront,
  Plus,
  PencilSimple,
  Trash,
  MagnifyingGlass,
  Package,
  CheckCircle,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import { supabase } from '../lib/supabase';
import AdminPageHeader from '../components/common/AdminPageHeader';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import ToggleSwitch from '../components/common/ToggleSwitch';
import FormField from '../components/common/FormField';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';

const defaultCollectionForm = {
  id: '',
  title: '',
  slug: '',
  subtitle: '',
  description: '',
  image_url: '',
  is_visible: true,
  is_featured_home: false,
  is_featured_shop: false,
  sort_order: 0,
  productIds: [],
};

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const Collections = () => {
  const [collections, setCollections] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingCollection, setDeletingCollection] = useState(null);
  const [deletingId, setDeletingId] = useState('');
  const [formData, setFormData] = useState(defaultCollectionForm);
  const [productSearch, setProductSearch] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchCollectionsData();
  }, []);

  const fetchCollectionsData = async () => {
    setLoading(true);
    try {
      const [collectionsResult, productsResult] = await Promise.all([
        supabase
          .from('collections')
          .select('*, collection_products(product_id, sort_order)')
          .order('sort_order', { ascending: true }),
        supabase.from('products').select('id, name, category, is_live').order('name', { ascending: true }),
      ]);

      if (collectionsResult.error) throw collectionsResult.error;
      if (productsResult.error) throw productsResult.error;

      setCollections(collectionsResult.data || []);
      setProducts(productsResult.data || []);
    } catch (error) {
      console.error('Error fetching collections:', error.message);
      setFeedback({ type: 'error', message: `Failed to load collections: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = collections.length;
    const visible = collections.filter((c) => c.is_visible).length;
    const featuredHome = collections.filter((c) => c.is_featured_home).length;
    const featuredShop = collections.filter((c) => c.is_featured_shop).length;
    return { total, visible, featuredHome, featuredShop };
  }, [collections]);

  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) return collections;
    const q = searchQuery.toLowerCase();
    return collections.filter(
      (c) =>
        (c.title || '').toLowerCase().includes(q) ||
        (c.slug || '').toLowerCase().includes(q) ||
        (c.subtitle || '').toLowerCase().includes(q)
    );
  }, [collections, searchQuery]);

  const filteredProductsForPicker = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const openNewEditor = () => {
    setFormData(defaultCollectionForm);
    setFormError('');
    setProductSearch('');
    setEditorOpen(true);
  };

  const openEditEditor = (collection) => {
    setFormData({
      id: collection.id,
      title: collection.title || '',
      slug: collection.slug || '',
      subtitle: collection.subtitle || '',
      description: collection.description || '',
      image_url: collection.image_url || '',
      is_visible: Boolean(collection.is_visible),
      is_featured_home: Boolean(collection.is_featured_home),
      is_featured_shop: Boolean(collection.is_featured_shop),
      sort_order: collection.sort_order ?? 0,
      productIds: (collection.collection_products || [])
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((entry) => entry.product_id),
    });
    setFormError('');
    setProductSearch('');
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setFormData(defaultCollectionForm);
    setFormError('');
    setProductSearch('');
  };

  const handleFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };
      if (name === 'title' && !prev.id) next.slug = slugify(value);
      return next;
    });
  };

  const toggleProductSelection = (productId) => {
    setFormData((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(productId)
        ? prev.productIds.filter((id) => id !== productId)
        : [...prev.productIds, productId],
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Collection title is required.');
      return;
    }
    if (!formData.slug.trim()) {
      setFormError('Collection slug is required.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const payload = {
        title: formData.title.trim(),
        slug: slugify(formData.slug),
        subtitle: formData.subtitle.trim(),
        description: formData.description.trim(),
        image_url: formData.image_url.trim(),
        is_visible: formData.is_visible,
        is_featured_home: formData.is_featured_home,
        is_featured_shop: formData.is_featured_shop,
        sort_order: Number(formData.sort_order || 0),
      };

      let collectionId = formData.id;

      if (formData.id) {
        const { error } = await supabase.from('collections').update(payload).eq('id', formData.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('collections').insert(payload).select('id').single();
        if (error) throw error;
        collectionId = data.id;
      }

      const { error: deleteLinksError } = await supabase
        .from('collection_products')
        .delete()
        .eq('collection_id', collectionId);
      if (deleteLinksError) throw deleteLinksError;

      if (formData.productIds.length > 0) {
        const rows = formData.productIds.map((productId, index) => ({
          collection_id: collectionId,
          product_id: productId,
          sort_order: index,
        }));
        const { error: insertLinksError } = await supabase.from('collection_products').insert(rows);
        if (insertLinksError) throw insertLinksError;
      }

      await fetchCollectionsData();
      closeEditor();
      setFeedback({
        type: 'success',
        message: formData.id ? 'Collection updated successfully.' : 'Collection created successfully.',
      });
    } catch (error) {
      setFormError(`Error saving collection: ${error.message}. Ensure collections schema exists in Supabase.`);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCollection) return;
    setDeletingId(deletingCollection.id);
    try {
      const { error } = await supabase.from('collections').delete().eq('id', deletingCollection.id);
      if (error) throw error;
      await fetchCollectionsData();
      setFeedback({ type: 'success', message: `Collection "${deletingCollection.title}" deleted.` });
      setDeletingCollection(null);
    } catch (error) {
      setFeedback({ type: 'error', message: `Error deleting collection: ${error.message}` });
    } finally {
      setDeletingId('');
    }
  };

  if (loading) {
    return (
      <div className="admin-page-container">
        <AdminPageHeader
          eyebrow="Merchandising"
          title="Collections"
          description="Curate product groups for the storefront experience without changing individual product records."
        />
        <div className="admin-loading-state" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
          Loading collections...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container" style={{ display: 'grid', gap: '24px' }}>
      <AdminPageHeader
        eyebrow="Merchandising"
        title="Collections"
        description="Curate product groups for the homepage and shop experience without changing individual product records."
        actions={
          <button className="btn-primary" onClick={openNewEditor} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} weight="bold" />
            New Collection
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
          label="Total Collections"
          value={stats.total}
          description={`${stats.visible} currently visible on store`}
          icon={Folder}
          tone="neutral"
        />
        <StatCard
          label="Homepage Curated"
          value={stats.featuredHome}
          description="Featured on homepage carousel"
          icon={House}
          tone="info"
        />
        <StatCard
          label="Shop Featured"
          value={stats.featuredShop}
          description="Highlighted in shop discovery"
          icon={Storefront}
          tone="success"
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
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--admin-text)' }}>All Collections</h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: 'var(--admin-text-muted)' }}>
              Manage merchandising groups, visibility, and product contents.
            </p>
          </div>
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
              placeholder="Search collections..."
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

        {filteredCollections.length === 0 ? (
          <div style={{ padding: '40px 20px' }}>
            <EmptyState
              icon={Package}
              title={searchQuery ? 'No matching collections' : 'No collections yet'}
              description={
                searchQuery
                  ? `No collections match "${searchQuery}". Clear your search or create a new one.`
                  : 'Organize your products into collections to feature them on the homepage and throughout the store.'
              }
              action={
                searchQuery ? (
                  <button className="btn-secondary" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </button>
                ) : (
                  <button className="btn-primary" onClick={openNewEditor}>
                    <Plus size={16} /> Create Collection
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
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Collection</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Slug</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Visibility</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Homepage</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Shop</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Products</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCollections.map((collection) => {
                  const productCount = collection.collection_products?.length || 0;
                  return (
                    <tr
                      key={collection.id}
                      style={{ borderBottom: '1px solid var(--admin-border)', transition: 'background 0.15s ease' }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--admin-text)', fontSize: '0.92rem' }}>{collection.title}</div>
                        {collection.subtitle && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginTop: '2px' }}>{collection.subtitle}</div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <code style={{ fontSize: '0.82rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--admin-surface-hover)', color: 'var(--admin-text-muted)' }}>
                          {collection.slug}
                        </code>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <StatusBadge status={collection.is_visible ? 'success' : 'neutral'}>
                          {collection.is_visible ? 'Visible' : 'Hidden'}
                        </StatusBadge>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {collection.is_featured_home ? (
                          <StatusBadge status="info">Featured</StatusBadge>
                        ) : (
                          <span style={{ color: 'var(--admin-text-subtle)', fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {collection.is_featured_shop ? (
                          <StatusBadge status="success">Featured</StatusBadge>
                        ) : (
                          <span style={{ color: 'var(--admin-text-subtle)', fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: 'var(--admin-surface-hover)',
                            border: '1px solid var(--admin-border)',
                            fontSize: '0.82rem',
                            fontWeight: 500,
                            color: 'var(--admin-text)',
                          }}
                        >
                          {productCount} {productCount === 1 ? 'item' : 'items'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => openEditEditor(collection)}
                            style={{ padding: '6px 10px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Edit collection"
                          >
                            <PencilSimple size={14} />
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setDeletingCollection(collection)}
                            style={{
                              padding: '6px 10px',
                              fontSize: '0.82rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: 'var(--admin-danger)',
                            }}
                            title="Delete collection"
                          >
                            <Trash size={14} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Collection Editor Modal */}
      <Modal
        isOpen={editorOpen}
        onClose={closeEditor}
        title={formData.id ? 'Edit Collection' : 'Create Collection'}
        maxWidth="720px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button type="button" className="btn-secondary" onClick={closeEditor} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : formData.id ? 'Save Changes' : 'Create Collection'}
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <FormField label="Collection Title" required id="col-title">
              <input
                id="col-title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleFieldChange}
                placeholder="e.g. Summer Essentials"
                required
              />
            </FormField>

            <FormField label="Slug" required hint="URL handle for the collection" id="col-slug">
              <input
                id="col-slug"
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleFieldChange}
                placeholder="e.g. summer-essentials"
                required
              />
            </FormField>
          </div>

          <FormField label="Subtitle" hint="Brief merchandising tagline" id="col-subtitle">
            <input
              id="col-subtitle"
              type="text"
              name="subtitle"
              value={formData.subtitle}
              onChange={handleFieldChange}
              placeholder="e.g. Curated minimalist pieces for warmer days"
            />
          </FormField>

          <FormField label="Description" hint="Detailed copy displayed on collection views" id="col-description">
            <textarea
              id="col-description"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleFieldChange}
              placeholder="Describe the aesthetic and philosophy behind this collection..."
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <FormField label="Banner Image URL" hint="Optional hero banner image" id="col-image">
              <input
                id="col-image"
                type="text"
                name="image_url"
                value={formData.image_url}
                onChange={handleFieldChange}
                placeholder="https://..."
              />
            </FormField>

            <FormField label="Sort Order" hint="Positioning priority (lower numbers appear first)" id="col-order">
              <input
                id="col-order"
                type="number"
                name="sort_order"
                value={formData.sort_order}
                onChange={handleFieldChange}
              />
            </FormField>
          </div>

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
              label="Storefront Visibility"
              description="Make this collection visible and accessible to customers"
              checked={formData.is_visible}
              onChange={(val) => setFormData((prev) => ({ ...prev, is_visible: val }))}
            />
            <div style={{ height: '1px', background: 'var(--admin-border)' }} />
            <ToggleSwitch
              label="Feature on Homepage"
              description="Show this collection in the homepage curation strip"
              checked={formData.is_featured_home}
              onChange={(val) => setFormData((prev) => ({ ...prev, is_featured_home: val }))}
            />
            <div style={{ height: '1px', background: 'var(--admin-border)' }} />
            <ToggleSwitch
              label="Feature in Shop"
              description="Highlight this collection for shop discovery and quick filters"
              checked={formData.is_featured_shop}
              onChange={(val) => setFormData((prev) => ({ ...prev, is_featured_shop: val }))}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--admin-text)' }}>
                Products in this Collection ({formData.productIds.length} selected)
              </label>
              {formData.productIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, productIds: [] }))}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.8rem',
                    color: 'var(--admin-danger)',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Clear all
                </button>
              )}
            </div>

            <div style={{ marginBottom: '10px', position: 'relative' }}>
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
                placeholder="Filter products to add/remove..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
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

            <div
              className="collection-product-picker"
              style={{
                border: '1px solid var(--admin-border)',
                borderRadius: 'var(--admin-radius-md, 8px)',
                padding: '8px',
                background: 'var(--admin-surface)',
                maxHeight: '260px',
              }}
            >
              {filteredProductsForPicker.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '0.86rem' }}>
                  No products match filter.
                </div>
              ) : (
                filteredProductsForPicker.map((product) => {
                  const isSelected = formData.productIds.includes(product.id);
                  return (
                    <label
                      key={product.id}
                      className="collection-product-row"
                      style={{
                        cursor: 'pointer',
                        padding: '10px 12px',
                        background: isSelected ? 'var(--admin-surface-hover)' : 'transparent',
                        borderColor: isSelected ? 'var(--admin-primary)' : 'var(--admin-border)',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <strong style={{ color: 'var(--admin-text)', fontSize: '0.9rem' }}>{product.name}</strong>
                        <small style={{ color: 'var(--admin-text-muted)', display: 'block', marginTop: '2px' }}>
                          {product.category || 'Uncategorised'} {product.is_live ? '• Live' : '• Draft'}
                        </small>
                      </div>
                      <input
                        className="admin-toggle-input"
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleProductSelection(product.id)}
                        style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                      />
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(deletingCollection)}
        title="Delete Collection"
        message={`Are you sure you want to delete "${deletingCollection?.title}"? Products associated with this collection will not be deleted.`}
        confirmText="Delete Collection"
        cancelText="Cancel"
        danger
        loading={deletingId === deletingCollection?.id}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingCollection(null)}
      />
    </div>
  );
};

export default Collections;
