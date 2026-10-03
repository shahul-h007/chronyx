import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowSquareOut,
  CheckCircle,
  CurrencyInr,
  DownloadSimple,
  FloppyDisk,
  Image as ImageIcon,
  Package,
  Plus,
  PlusCircle,
  Sliders,
  Sparkle,
  Trash,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import { supabase } from '../lib/supabase';
import ImageUpload from '../components/ImageUpload';
import AdminPageHeader from '../components/common/AdminPageHeader';
import FormField from '../components/common/FormField';
import ToggleSwitch from '../components/common/ToggleSwitch';
import StatusBadge from '../components/common/StatusBadge';
import {
  buildPublicProductId,
  buildUnitQrCodeUrl,
  buildUnitVerificationUrl,
  createAuthenticityUnit,
} from '../lib/productIdentity';
import { adminConfig, formatCurrency } from '../config/adminConfig';

const defaultFormData = {
  name: '',
  description: '',
  price: 0,
  category: 'Wall Clocks',
  tags: '',
  stock_quantity: 10,
  is_live: false,
  is_limited_drop: false,
  drop_date: '',
  tagline: '',
  attributes: [],
  summary: '',
  story: '',
  care_instructions: '',
  features: '',
  video_url: '',
  video_embed_url: '',
  video_thumbnail_url: '',
  video_title: '',
  video_description: '',
  video_duration_seconds: '',
  video_upload_date: '',
  video_view_count: '',
  video_transcript: '',
  video_srt_url: '',
};

function InfoPill({ icon, label, value }) {
  return (
    <div className="product-editor-pill">
      <span className="product-editor-pill-icon">{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);
  const [images, setImages] = useState([]);
  const [authUnits, setAuthUnits] = useState([]);
  const [authError, setAuthError] = useState('');
  const [syncingUnits, setSyncingUnits] = useState(false);
  const [downloadingUnitId, setDownloadingUnitId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isEditing) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setErrorMessage('');
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (productError) throw productError;

      const { data: productImages, error: imagesError } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', id)
        .order('sort_order', { ascending: true });

      if (imagesError) throw imagesError;

      let initialAttributes = [];
      if (product.attributes && typeof product.attributes === 'object' && Object.keys(product.attributes).length > 0) {
        initialAttributes = Object.entries(product.attributes).map(([key, value]) => ({
          key,
          value: value != null ? String(value) : '',
        }));
      } else {
        const legacy = [
          { key: 'Size', value: product.size },
          { key: 'Finish', value: product.finish },
          { key: 'Material', value: product.material },
          { key: 'Movement Type', value: product.movement_type },
        ].filter((item) => item.value);
        if (legacy.length > 0) {
          initialAttributes = legacy;
        }
      }

      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        category: product.category || 'Wall Clocks',
        tags: product.tags ? product.tags.join(', ') : '',
        stock_quantity: product.stock_quantity,
        is_live: product.is_live,
        is_limited_drop: product.is_limited_drop,
        drop_date: product.drop_date ? new Date(product.drop_date).toISOString().slice(0, 16) : '',
        tagline: product.tagline || '',
        attributes: initialAttributes,
        summary: product.summary || '',
        story: product.story || product.description || '',
        care_instructions: product.care_instructions ? product.care_instructions.join('\n') : '',
        features: product.features ? product.features.join('\n') : '',
        video_url: product.video_url || '',
        video_embed_url: product.video_embed_url || '',
        video_thumbnail_url: product.video_thumbnail_url || '',
        video_title: product.video_title || '',
        video_description: product.video_description || '',
        video_duration_seconds: product.video_duration_seconds || '',
        video_upload_date: product.video_upload_date
          ? new Date(product.video_upload_date).toISOString().slice(0, 16)
          : '',
        video_view_count: product.video_view_count || '',
        video_transcript: product.video_transcript || '',
        video_srt_url: product.video_srt_url || '',
      });

      setImages((productImages || []).map((img) => img.image_url));
      await loadAuthUnits(product.id);
    } catch (error) {
      console.error('Error fetching product:', error.message);
      setErrorMessage(`Error loading product: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadAuthUnits = async (productId) => {
    try {
      const { data, error } = await supabase
        .from('product_auth_units')
        .select('*')
        .eq('product_id', productId)
        .order('serial_number', { ascending: true });

      if (error) throw error;
      setAuthUnits(data || []);
      setAuthError('');
      return data || [];
    } catch (error) {
      console.error('Error loading authenticity units:', error.message);
      setAuthUnits([]);
      setAuthError(error.message);
      return [];
    }
  };

  const syncAuthenticityUnits = async (productId, productName, stockTarget) => {
    setSyncingUnits(true);
    try {
      const existingUnits = await loadAuthUnits(productId);
      const desiredCount = Math.max(0, Number(stockTarget || 0));

      if (existingUnits.length < desiredCount) {
        const nextUnits = [];

        for (let serialNumber = existingUnits.length + 1; serialNumber <= desiredCount; serialNumber += 1) {
          nextUnits.push({
            product_id: productId,
            ...createAuthenticityUnit({ id: productId, name: productName }, serialNumber),
          });
        }

        if (nextUnits.length > 0) {
          const { error } = await supabase.from('product_auth_units').insert(nextUnits);
          if (error) throw error;
        }
      }

      await loadAuthUnits(productId);
    } catch (error) {
      console.error('Error syncing authenticity units:', error.message);
      setAuthError(error.message);
      throw error;
    } finally {
      setSyncingUnits(false);
    }
  };

  const downloadUnitQr = async (unit) => {
    setDownloadingUnitId(unit.id);

    try {
      const qrUrl = buildUnitQrCodeUrl(unit);
      const response = await fetch(qrUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch QR image.');
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `${unit.public_unit_id}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Error downloading QR:', error.message);
      setErrorMessage(`Error downloading QR: ${error.message}`);
    } finally {
      setDownloadingUnitId('');
    }
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddAttribute = () => {
    setFormData((current) => ({
      ...current,
      attributes: [...(current.attributes || []), { key: '', value: '' }],
    }));
  };

  const handleAttributeChange = (index, field, value) => {
    setFormData((current) => {
      const next = [...(current.attributes || [])];
      next[index] = { ...next[index], [field]: value };
      return { ...current, attributes: next };
    });
  };

  const handleRemoveAttribute = (index) => {
    setFormData((current) => ({
      ...current,
      attributes: (current.attributes || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const attributesObject = (formData.attributes || []).reduce((acc, { key, value }) => {
        const trimmedKey = String(key || '').trim();
        if (trimmedKey) {
          acc[trimmedKey] = String(value || '').trim();
        }
        return acc;
      }, {});

      const productPayload = {
        name: formData.name,
        description: formData.description || formData.story,
        price: Number(formData.price),
        category: formData.category,
        tags: formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        stock_quantity: Number(formData.stock_quantity),
        is_live: formData.is_live,
        is_limited_drop: formData.is_limited_drop,
        drop_date: formData.is_limited_drop && formData.drop_date ? new Date(formData.drop_date).toISOString() : null,
        tagline: formData.tagline,
        attributes: attributesObject,
        summary: formData.summary,
        story: formData.story,
        care_instructions: formData.care_instructions.split('\n').map((item) => item.trim()).filter(Boolean),
        features: formData.features.split('\n').map((item) => item.trim()).filter(Boolean),
        video_url: formData.video_url.trim() || null,
        video_embed_url: formData.video_embed_url.trim() || null,
        video_thumbnail_url: formData.video_thumbnail_url.trim() || null,
        video_title: formData.video_title.trim() || null,
        video_description: formData.video_description.trim() || null,
        video_duration_seconds: formData.video_duration_seconds ? Number(formData.video_duration_seconds) : null,
        video_upload_date: formData.video_upload_date ? new Date(formData.video_upload_date).toISOString() : null,
        video_view_count: formData.video_view_count ? Number(formData.video_view_count) : null,
        video_transcript: formData.video_transcript.trim() || null,
        video_srt_url: formData.video_srt_url.trim() || null,
      };

      let productId = id;

      if (isEditing) {
        const { error } = await supabase.from('products').update(productPayload).eq('id', productId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('products').insert([productPayload]).select().single();
        if (error) throw error;
        productId = data.id;
      }

      if (isEditing) {
        await supabase.from('product_images').delete().eq('product_id', productId);
      }

      if (images.length > 0) {
        const imagePayload = images.map((url, index) => ({
          product_id: productId,
          image_url: url,
          is_hero: index === 0,
          sort_order: index,
        }));

        const { error: imageError } = await supabase.from('product_images').insert(imagePayload);
        if (imageError) throw imageError;
      }

      await syncAuthenticityUnits(productId, productPayload.name, productPayload.stock_quantity);
      setSuccessMessage('Product saved successfully!');
      setTimeout(() => {
        navigate('/products');
      }, 600);
    } catch (error) {
      console.error('Error saving product:', error.message);
      setErrorMessage(`Error saving product: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const featureCount = useMemo(
    () => formData.features.split('\n').map((item) => item.trim()).filter(Boolean).length,
    [formData.features],
  );
  const careCount = useMemo(
    () => formData.care_instructions.split('\n').map((item) => item.trim()).filter(Boolean).length,
    [formData.care_instructions],
  );
  const visibleTags = formData.tags.split(',').map((item) => item.trim()).filter(Boolean);
  const previewImage = images[0] || '';
  const publicProductId = buildPublicProductId(id);
  const issuedUnitCount = authUnits.length;
  const missingUnitCount = Math.max(0, Number(formData.stock_quantity || 0) - issuedUnitCount);

  if (loading) {
    return (
      <div className="product-editor-page" style={{ padding: '40px 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--admin-text-muted)' }}>Loading product editor...</p>
      </div>
    );
  }

  return (
    <form className="product-editor-page" onSubmit={handleSubmit}>
      <AdminPageHeader
        eyebrow="Commerce · Catalog"
        title={isEditing ? 'Edit Product' : 'New Product'}
        description={
          isEditing
            ? 'Update product details, dynamic specifications, rich media, and inventory status.'
            : 'Create a new product with custom specifications, media gallery, and catalog controls.'
        }
        actions={
          <>
            <button
              className="btn-secondary"
              type="button"
              onClick={() => navigate('/products')}
            >
              <ArrowLeft size={16} />
              <span>Back to Products</span>
            </button>
            <button className="btn-primary product-editor-save" type="submit" disabled={saving}>
              <FloppyDisk size={18} />
              <span>{saving ? 'Saving...' : 'Save Product'}</span>
            </button>
          </>
        }
      />

      {errorMessage && (
        <div className="product-error-banner" role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <WarningCircle size={20} />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '4px 8px', border: 'none', background: 'transparent' }}
            onClick={() => setErrorMessage('')}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="product-success-banner" role="status">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={20} />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      <div className="product-editor-summary">
        <InfoPill
          icon={<Package size={18} />}
          label="Status"
          value={
            <StatusBadge status={formData.is_live ? 'success' : 'neutral'}>
              {formData.is_live ? 'Live on Store' : 'Draft'}
            </StatusBadge>
          }
        />
        <InfoPill icon={<Sparkle size={18} />} label="Gallery" value={`${images.length} images`} />
        <InfoPill
          icon={<Sliders size={18} />}
          label="Specifications"
          value={`${(formData.attributes || []).length} custom specs`}
        />
        <InfoPill
          icon={<CurrencyInr size={18} />}
          label="Inventory"
          value={`${Number(formData.stock_quantity || 0)} units`}
        />
      </div>

      <div className="product-editor-layout">
        <div className="product-editor-main">
          {/* Section 1: General Information */}
          <section className="settings-panel product-editor-panel">
            <div className="settings-panel-header">
              <div>
                <p className="settings-panel-eyebrow">Identity</p>
                <h3>General Information</h3>
                <p>Define the core product naming, messaging, and narrative shown to shoppers.</p>
              </div>
            </div>
            <div className="settings-panel-body product-editor-grid">
              <FormField label="Product Name" required hint="The primary display name shown across all surfaces.">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. The Singularitas"
                />
              </FormField>

              <FormField label="Tagline" hint="A concise summary phrase highlighted on product cards and hero banners.">
                <input
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleChange}
                  placeholder="A sculptural statement for quiet interiors."
                />
              </FormField>

              <FormField label="Short Summary" hint="Used in catalog cards, search snippets, and compact listings.">
                <textarea
                  name="summary"
                  value={formData.summary}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Write a tight, compelling summary for the product listing."
                />
              </FormField>

              <FormField label="Story / Long Description" hint="The comprehensive narrative displayed on the product detail page.">
                <textarea
                  name="story"
                  value={formData.story}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Tell the full product story, craftsmanship, material feel, and design intent."
                />
              </FormField>
            </div>
          </section>

          {/* Section 2: Technical Specifications & Dynamic Attributes */}
          <section className="settings-panel product-editor-panel">
            <div className="settings-panel-header">
              <div>
                <p className="settings-panel-eyebrow">Technical Details</p>
                <h3>Specifications & Details</h3>
                <p>Define dynamic specifications, key features, and maintenance guidance.</p>
              </div>
            </div>
            <div className="settings-panel-body product-editor-grid">
              <div className="product-attr-builder">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="admin-field-label" style={{ margin: 0, fontWeight: 600 }}>
                    Custom Specifications
                  </label>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem' }}
                    onClick={handleAddAttribute}
                  >
                    <Plus size={15} /> Add Specification
                  </button>
                </div>

                {(formData.attributes || []).length > 0 && (
                  <div className="product-attr-header">
                    <span>Attribute Name</span>
                    <span>Value</span>
                    <span></span>
                  </div>
                )}

                {(formData.attributes || []).length === 0 ? (
                  <div className="product-attr-empty">
                    No custom specifications defined yet. Click "Add Specification" to add parameters like Dimensions, Weight, Materials, or Movement.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {(formData.attributes || []).map((attr, index) => (
                      <div key={index} className="product-attr-row">
                        <input
                          type="text"
                          placeholder="e.g. Dimensions"
                          value={attr.key}
                          onChange={(e) => handleAttributeChange(index, 'key', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="e.g. 46 cm"
                          value={attr.value}
                          onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{
                            padding: '8px',
                            display: 'grid',
                            placeItems: 'center',
                            color: 'var(--admin-danger)',
                          }}
                          onClick={() => handleRemoveAttribute(index)}
                          title="Remove specification"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="product-editor-grid product-editor-grid-half" style={{ marginTop: '8px' }}>
                <FormField label="Features" hint="One feature highlight per line.">
                  <textarea
                    name="features"
                    value={formData.features}
                    onChange={handleChange}
                    rows={5}
                    placeholder={'Silent sweep movement\nHand-oiled finish\nHeirloom-grade timber'}
                  />
                </FormField>

                <FormField label="Care Instructions" hint="One maintenance note per line.">
                  <textarea
                    name="care_instructions"
                    value={formData.care_instructions}
                    onChange={handleChange}
                    rows={5}
                    placeholder={'Dust with a soft microfiber cloth\nAvoid direct prolonged sunlight\nKeep away from high humidity'}
                  />
                </FormField>
              </div>
            </div>
          </section>

          {/* Section 3: Media Gallery */}
          <section className="settings-panel product-editor-panel">
            <div className="settings-panel-header">
              <div>
                <p className="settings-panel-eyebrow">Visual Assets</p>
                <h3>Product Imagery</h3>
                <p>Upload photography for the product gallery. The first image serves as the storefront hero frame.</p>
              </div>
            </div>
            <div className="settings-panel-body">
              <ImageUpload images={images} onImagesChange={setImages} />
            </div>
          </section>

          {/* Section 4: Video SEO & Rich Media */}
          <section className="settings-panel product-editor-panel">
            <div className="settings-panel-header">
              <div>
                <p className="settings-panel-eyebrow">Rich Media & SEO</p>
                <h3>Video Metadata</h3>
                <p>Attach product demonstration videos and structured metadata for search indexing and VideoObject schema.</p>
              </div>
            </div>
            <div className="settings-panel-body product-editor-grid">
              <div className="product-editor-grid product-editor-grid-half">
                <FormField label="Direct Video URL" hint="MP4/WebM file (e.g. Cloudinary, S3).">
                  <input
                    type="url"
                    name="video_url"
                    value={formData.video_url}
                    onChange={handleChange}
                    placeholder="https://cdn.example.com/videos/product-core.mp4"
                  />
                </FormField>

                <FormField label="Embed URL" hint="YouTube or Vimeo player URL as alternative.">
                  <input
                    type="url"
                    name="video_embed_url"
                    value={formData.video_embed_url}
                    onChange={handleChange}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </FormField>
              </div>

              <div className="product-editor-grid product-editor-grid-half">
                <FormField label="Video Title">
                  <input
                    type="text"
                    name="video_title"
                    value={formData.video_title}
                    onChange={handleChange}
                    placeholder="Product design and craftsmanship overview"
                  />
                </FormField>

                <FormField label="Video Thumbnail URL">
                  <input
                    type="url"
                    name="video_thumbnail_url"
                    value={formData.video_thumbnail_url}
                    onChange={handleChange}
                    placeholder="https://cdn.example.com/thumbnails/video-poster.jpg"
                  />
                </FormField>
              </div>

              <FormField label="Video Description" hint="Used in video sitemaps and schema.org search engine cards.">
                <textarea
                  name="video_description"
                  value={formData.video_description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe what the viewer learns, highlighting key product attributes."
                />
              </FormField>

              <FormField label="Video Transcript" hint="Full transcript for search indexing and accessibility.">
                <textarea
                  name="video_transcript"
                  value={formData.video_transcript}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Paste video speech transcript here."
                />
              </FormField>

              <div className="product-editor-grid product-editor-grid-half">
                <FormField label="Duration (Seconds)">
                  <input
                    type="number"
                    min="0"
                    name="video_duration_seconds"
                    value={formData.video_duration_seconds}
                    onChange={handleChange}
                    placeholder="92"
                  />
                </FormField>

                <FormField label="Upload Date">
                  <input
                    type="datetime-local"
                    name="video_upload_date"
                    value={formData.video_upload_date}
                    onChange={handleChange}
                  />
                </FormField>
              </div>

              <div className="product-editor-grid product-editor-grid-half">
                <FormField label="View Count">
                  <input
                    type="number"
                    min="0"
                    name="video_view_count"
                    value={formData.video_view_count}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </FormField>

                <FormField label="Subtitle File URL (.vtt / .srt)">
                  <input
                    type="url"
                    name="video_srt_url"
                    value={formData.video_srt_url}
                    onChange={handleChange}
                    placeholder="https://cdn.example.com/captions/subtitles-en.vtt"
                  />
                </FormField>
              </div>
            </div>
          </section>
        </div>

        <aside className="product-editor-side">
          {/* Section 5: Publishing & Visibility */}
          <section className="settings-panel product-editor-panel">
            <div className="settings-panel-header">
              <div>
                <p className="settings-panel-eyebrow">Status</p>
                <h3>Publishing & Drops</h3>
                <p>Manage customer availability and promotional drop timing.</p>
              </div>
            </div>
            <div className="settings-panel-body" style={{ display: 'grid', gap: '16px' }}>
              <ToggleSwitch
                label={formData.is_live ? 'Published on Storefront' : 'Draft Only (Hidden)'}
                description="When enabled, this product is indexed and purchasable by customers."
                checked={formData.is_live}
                onChange={(val) => setFormData((cur) => ({ ...cur, is_live: val }))}
              />

              <ToggleSwitch
                label={formData.is_limited_drop ? 'Limited Drop Enabled' : 'Standard Release'}
                description="Activates the countdown timer and limited availability framing."
                checked={formData.is_limited_drop}
                onChange={(val) => setFormData((cur) => ({ ...cur, is_limited_drop: val }))}
              />

              {formData.is_limited_drop && (
                <div className="product-editor-drop-date">
                  <FormField label="Drop Date & Time" hint="Controls the storefront drop countdown.">
                    <input
                      type="datetime-local"
                      name="drop_date"
                      value={formData.drop_date}
                      onChange={handleChange}
                    />
                  </FormField>
                </div>
              )}
            </div>
          </section>

          {/* Section 6: Pricing & Inventory */}
          <section className="settings-panel product-editor-panel">
            <div className="settings-panel-header">
              <div>
                <p className="settings-panel-eyebrow">Commerce</p>
                <h3>Pricing & Inventory</h3>
                <p>Set unit pricing and monitor available stock counts.</p>
              </div>
            </div>
            <div className="settings-panel-body product-editor-grid">
              <FormField label={`Price (${adminConfig.localization?.currencyCode || 'INR'})`} required>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="any"
                  required
                />
              </FormField>

              <FormField label="Stock Quantity" required hint="Total physical units available for order.">
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </FormField>
            </div>
          </section>

          {/* Section 7: Catalog Organization */}
          <section className="settings-panel product-editor-panel">
            <div className="settings-panel-header">
              <div>
                <p className="settings-panel-eyebrow">Taxonomy</p>
                <h3>Organization</h3>
                <p>Categorize and tag for storefront filters and search discoverability.</p>
              </div>
            </div>
            <div className="settings-panel-body product-editor-grid">
              <FormField label="Category" hint="Select a default or enter a custom category.">
                <input
                  type="text"
                  list="category-suggestions"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="e.g. Wall Clocks"
                />
                <datalist id="category-suggestions">
                  <option value="Wall Clocks" />
                  <option value="Desk Clocks" />
                  <option value="Accessories" />
                  <option value="Furniture" />
                  <option value="Lighting" />
                </datalist>
              </FormField>

              <FormField label="Tags" hint="Separate tags with commas.">
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="minimalist, walnut, limited"
                />
              </FormField>
            </div>
          </section>

          {/* Section 8: Live Preview Card */}
          <section className="settings-panel product-editor-panel product-preview-panel">
            <div className="settings-panel-header">
              <div>
                <p className="settings-panel-eyebrow">Preview</p>
                <h3>Card Snapshot</h3>
                <p>Real-time visual check of how the card appears on the storefront.</p>
              </div>
            </div>
            <div className="settings-panel-body">
              <div className="product-preview-stage">
                {previewImage ? (
                  <img src={previewImage} alt={formData.name || 'Product preview'} />
                ) : (
                  <div className="product-preview-empty">
                    <ImageIcon size={28} />
                    <strong>No Hero Image</strong>
                    <p>Upload an image above to preview the product card.</p>
                  </div>
                )}
              </div>
              <div className="product-preview-copy">
                <p className="label">{formData.category || 'Uncategorized'}</p>
                <h4>{formData.name || 'Untitled Product'}</h4>
                <p>{formData.tagline || 'Add a tagline to preview here.'}</p>
                <strong>{formatCurrency(formData.price || 0)}</strong>
              </div>
              {visibleTags.length > 0 && (
                <div className="product-preview-tags">
                  {visibleTags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Section 9: Authenticity Registry */}
          <section className="settings-panel product-editor-panel product-auth-panel">
            <div className="settings-panel-header">
              <div>
                <p className="settings-panel-eyebrow">Provenance</p>
                <h3>Certificate Registry</h3>
                <p>Issue one certificate per physical unit, download QR labels, and verify units.</p>
              </div>
            </div>
            <div className="settings-panel-body">
              {id ? (
                <div className="product-auth-registry">
                  <div className="product-auth-registry-top">
                    <div className="product-auth-item">
                      <small>Model ID</small>
                      <strong>{publicProductId}</strong>
                    </div>
                    <div className="product-auth-item">
                      <small>Units Issued</small>
                      <strong>{issuedUnitCount}</strong>
                    </div>
                    <div className="product-auth-item">
                      <small>Stock Target</small>
                      <strong>{Number(formData.stock_quantity || 0)}</strong>
                    </div>
                    <div className="product-auth-item">
                      <small>Missing Certs</small>
                      <strong>{missingUnitCount}</strong>
                    </div>
                  </div>

                  <div className="product-auth-toolbar">
                    <p>
                      Save the product to auto-issue any missing certificates. Issued certificates are preserved even if stock later decreases so sold units remain verifiable.
                    </p>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => syncAuthenticityUnits(id, formData.name, Number(formData.stock_quantity))}
                      disabled={syncingUnits}
                    >
                      <PlusCircle size={18} />
                      <span>{syncingUnits ? 'Syncing Certificates...' : 'Generate Missing Certificates'}</span>
                    </button>
                  </div>

                  {authError && (
                    <div className="product-auth-empty">
                      Authenticity registry note: {authError}
                    </div>
                  )}

                  {authUnits.length > 0 ? (
                    <div className="product-auth-unit-list">
                      {authUnits.map((unit) => {
                        const verificationUrl = buildUnitVerificationUrl(unit);
                        const qrCodeUrl = buildUnitQrCodeUrl(unit);

                        return (
                          <article key={unit.id} className="product-auth-unit-card">
                            <div className="product-auth-unit-preview">
                              <img src={qrCodeUrl} alt={`QR for ${unit.public_unit_id}`} />
                            </div>
                            <div className="product-auth-unit-copy">
                              <div className="product-auth-unit-meta">
                                <small>Unit #{unit.serial_number}</small>
                                <strong>{unit.public_unit_id}</strong>
                              </div>
                              <div className="product-auth-unit-meta">
                                <small>Authenticity Code</small>
                                <strong>{unit.authenticity_code}</strong>
                              </div>
                              <div className="product-auth-unit-meta">
                                <small>Verification Link</small>
                                <span>{verificationUrl}</span>
                              </div>
                              <div className="product-auth-unit-actions">
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  onClick={() => downloadUnitQr(unit)}
                                  disabled={downloadingUnitId === unit.id}
                                >
                                  <DownloadSimple size={16} />
                                  <span>{downloadingUnitId === unit.id ? 'Downloading...' : 'Download QR'}</span>
                                </button>
                                <a
                                  className="btn-secondary"
                                  href={verificationUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ArrowSquareOut size={16} />
                                  <span>Verify Page</span>
                                </a>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : !authError ? (
                    <div className="product-auth-empty">
                      No unit certificates issued yet. Save the product or generate missing certificates to create QR-based authenticity records.
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="product-auth-empty">
                  Save this product first to generate its model ID and issue unit authenticity certificates.
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>

      {/* Sticky Action Footer */}
      <div className="product-editor-footer-bar">
        <div className="product-editor-footer-info">
          <span>{isEditing ? `Editing: ${formData.name || 'Untitled Product'}` : 'Creating New Product'}</span>
          <StatusBadge status={formData.is_live ? 'success' : 'neutral'}>
            {formData.is_live ? 'Live' : 'Draft'}
          </StatusBadge>
        </div>
        <div className="product-editor-footer-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/products')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
          >
            <FloppyDisk size={18} />
            <span>{saving ? 'Saving...' : 'Save Product'}</span>
          </button>
        </div>
      </div>
    </form>
  );
};

export default ProductForm;
