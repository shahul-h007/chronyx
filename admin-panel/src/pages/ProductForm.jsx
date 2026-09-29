import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowSquareOut, CaretLeft, DownloadSimple, Eye, FloppyDisk, Package, Palette, Plus, PlusCircle, Sparkle, Trash } from '@phosphor-icons/react';
import { supabase } from '../lib/supabase';
import ImageUpload from '../components/ImageUpload';
import {
  buildPublicProductId,
  buildUnitQrCodeUrl,
  buildUnitVerificationUrl,
  createAuthenticityUnit,
} from '../lib/productIdentity';

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

function Field({ label, hint, children }) {
  return (
    <label className="settings-label product-editor-field">
      <span>{label}</span>
      {children}
      {hint ? <small className="settings-hint">{hint}</small> : null}
    </label>
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

  useEffect(() => {
    if (isEditing) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
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
      alert('Error loading product');
      navigate('/products');
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
      alert(`Error downloading QR: ${error.message}`);
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
      alert('Product saved successfully!');
      navigate('/products');
    } catch (error) {
      console.error('Error saving product:', error.message);
      alert(`Error saving product: ${error.message}`);
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

  if (loading) return <div>Loading product editor...</div>;

  return (
    <form className="product-editor-page" onSubmit={handleSubmit}>
      <div className="page-header product-editor-header">
        <div className="product-editor-title-row">
          <button className="btn-secondary product-editor-back" type="button" onClick={() => navigate('/products')}>
            <CaretLeft size={18} />
          </button>
          <div>
            <p className="settings-page-eyebrow">Catalog Editor</p>
            <h2>{isEditing ? 'Edit Product' : 'Create Product'}</h2>
            <p className="product-editor-subtitle">
              Refine the product story, media, pricing, and launch state from one clean control surface.
            </p>
          </div>
        </div>

        <button className="btn-primary product-editor-save" type="submit" disabled={saving}>
          <FloppyDisk size={18} />
          {saving ? 'Saving...' : 'Save Product'}
        </button>
      </div>

      <div className="product-editor-summary">
        <InfoPill icon={<Package size={16} />} label="Status" value={formData.is_live ? 'Live on store' : 'Draft'} />
        <InfoPill icon={<Sparkle size={16} />} label="Images" value={`${images.length} uploaded`} />
        <InfoPill icon={<Palette size={16} />} label="Features" value={`${featureCount} product highlights`} />
        <InfoPill icon={<Eye size={16} />} label="Care Notes" value={`${careCount} care lines`} />
      </div>

      <div className="product-editor-layout">
        <div className="product-editor-main">
          <section className="settings-panel product-editor-panel">
            <div className="settings-panel-header">
              <div>
                <p className="settings-panel-eyebrow">Core Copy</p>
                <h3>General Information</h3>
                <p>Set the main product identity customers see across the storefront.</p>
              </div>
            </div>
            <div className="settings-panel-body product-editor-grid">
              <Field label="Product Name">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. The Singularitas"
                />
              </Field>
              <Field label="Tagline">
                <input
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleChange}
                  placeholder="A sculptural statement for quiet interiors."
                />
              </Field>
              <Field label="Short Summary" hint="Used in cards, lists, and compact product surfaces.">
                <textarea
                  name="summary"
                  value={formData.summary}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Write a tight premium summary for the product listing."
                />
              </Field>
              <Field label="Story / Long Description" hint="Used as the richer narrative on the product page.">
                <textarea
                  name="story"
                  value={formData.story}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Tell the full product story, material feel, and design intent."
                />
              </Field>
            </div>
          </section>

          <section className="settings-panel product-editor-panel">
            <div className="settings-panel-header">
              <div>
                <p className="settings-panel-eyebrow">Technical Details</p>
                <h3>Specifications</h3>
                <p>Keep the product page structured and easy for customers to evaluate.</p>
              </div>
            </div>
            <div className="settings-panel-body product-editor-grid product-editor-grid-half">
              <div style={{ gridColumn: '1 / -1', display: 'grid', gap: '12px' }}>
                <label className="field-label" style={{ fontWeight: 600 }}>Custom Specifications</label>
                {(formData.attributes || []).length === 0 ? (
                  <p style={{ color: 'var(--text-secondary, #888)', fontSize: '0.9rem', margin: 0 }}>
                    No attributes added yet. Click below to add specifications like Dimensions, Weight, Materials, etc.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {(formData.attributes || []).map((attr, index) => (
                      <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Attribute name (e.g. Dimensions)"
                          value={attr.key}
                          onChange={(e) => handleAttributeChange(index, 'key', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Value (e.g. 46 cm)"
                          value={attr.value}
                          onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={() => handleRemoveAttribute(index)}
                          title="Remove attribute"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <button type="button" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={handleAddAttribute}>
                    <Plus size={16} /> Add attribute
                  </button>
                </div>
              </div>
              <Field label="Features" hint="One feature per line.">
                <textarea
                  name="features"
                  value={formData.features}
                  onChange={handleChange}
                  rows={6}
                  placeholder={'Silent sweep movement\nHand-oiled finish\nHeirloom-grade timber'}
                />
              </Field>
              <Field label="Care Instructions" hint="One instruction per line.">
                <textarea
                  name="care_instructions"
                  value={formData.care_instructions}
                  onChange={handleChange}
                  rows={6}
                  placeholder={'Dust with a soft cloth\nAvoid direct sunlight\nKeep away from moisture'}
                />
              </Field>
            </div>
          </section>

          <section className="settings-panel product-editor-panel">
            <div className="settings-panel-header">
              <div>
                <p className="settings-panel-eyebrow">Media</p>
                <h3>Images</h3>
                <p>The first image is treated as the hero image on the storefront.</p>
              </div>
            </div>
            <div className="settings-panel-body">
              <ImageUpload images={images} onImagesChange={setImages} />
            </div>
          </section>

          <section className="settings-panel product-editor-panel">
            <div className="settings-panel-header">
              <div>
                <p className="settings-panel-eyebrow">Video SEO</p>
                <h3>Video Metadata</h3>
                <p>Attach a hosted product video and the metadata needed for schema, transcripts, and the video sitemap.</p>
              </div>
            </div>
            <div className="settings-panel-body product-editor-grid">
              <Field label="Direct Video URL" hint="Best for tracked HTML5 playback, for example an MP4 or WebM file on Cloudinary.">
                <input type="url" name="video_url" value={formData.video_url} onChange={handleChange} placeholder="https://res.cloudinary.com/.../chronyx-core.mp4" />
              </Field>
              <Field label="Embed URL" hint="Optional YouTube or Vimeo player URL if you are not self-hosting the file.">
                <input type="url" name="video_embed_url" value={formData.video_embed_url} onChange={handleChange} placeholder="https://www.youtube.com/watch?v=..." />
              </Field>
              <Field label="Video Title">
                <input type="text" name="video_title" value={formData.video_title} onChange={handleChange} placeholder="The Chronyx Core design story" />
              </Field>
              <Field label="Thumbnail URL">
                <input type="url" name="video_thumbnail_url" value={formData.video_thumbnail_url} onChange={handleChange} placeholder="https://cdn.chronyx.in/video-thumbnails/core.jpg" />
              </Field>
              <Field label="Video Description" hint="Used in the video sitemap and VideoObject schema.">
                <textarea name="video_description" value={formData.video_description} onChange={handleChange} rows={5} placeholder="Describe what the viewer will learn and include the core search terms naturally." />
              </Field>
              <Field label="Transcript" hint="This appears on the product page for SEO and accessibility.">
                <textarea name="video_transcript" value={formData.video_transcript} onChange={handleChange} rows={7} placeholder="Paste the cleaned transcript here." />
              </Field>
              <Field label="Duration (seconds)">
                <input type="number" min="0" name="video_duration_seconds" value={formData.video_duration_seconds} onChange={handleChange} placeholder="92" />
              </Field>
              <Field label="Upload Date">
                <input type="datetime-local" name="video_upload_date" value={formData.video_upload_date} onChange={handleChange} />
              </Field>
              <Field label="View Count">
                <input type="number" min="0" name="video_view_count" value={formData.video_view_count} onChange={handleChange} placeholder="0" />
              </Field>
              <Field label="Subtitle File URL" hint="Public VTT URL for in-player captions, or SRT/VTT for download.">
                <input type="url" name="video_srt_url" value={formData.video_srt_url} onChange={handleChange} placeholder="https://cdn.chronyx.in/captions/core-en.vtt" />
              </Field>
            </div>
          </section>
        </div>

        <aside className="product-editor-side">
          <section className="settings-panel product-editor-panel product-preview-panel">
            <div className="settings-panel-header">
              <div>
                <p className="settings-panel-eyebrow">Live Preview</p>
                <h3>Hero Snapshot</h3>
                <p>Quick visual check of how the product feels before saving.</p>
              </div>
            </div>
            <div className="settings-panel-body">
              <div className="product-preview-stage">
                {previewImage ? (
                  <img src={previewImage} alt={formData.name || 'Product preview'} />
                ) : (
                  <div className="product-preview-empty">Upload a hero image to preview the product here.</div>
                )}
              </div>
              <div className="product-preview-copy">
                <p className="label">{formData.category || 'Category'}</p>
                <h4>{formData.name || 'Product name preview'}</h4>
                <p>{formData.tagline || 'Your product tagline will appear here once added.'}</p>
                <strong>INR {Number(formData.price || 0).toLocaleString('en-IN')}</strong>
              </div>
              {visibleTags.length > 0 ? (
                <div className="product-preview-tags">
                  {visibleTags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          <section className="settings-panel product-editor-panel product-auth-panel">
            <div className="settings-panel-header">
              <div>
                <p className="settings-panel-eyebrow">Authenticity</p>
                <h3>Certificate Inventory</h3>
                <p>Issue one certificate per physical unit, download QR labels, and verify each piece individually.</p>
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
                      <small>Units issued</small>
                      <strong>{issuedUnitCount}</strong>
                    </div>
                    <div className="product-auth-item">
                      <small>Current stock target</small>
                      <strong>{Number(formData.stock_quantity || 0)}</strong>
                    </div>
                    <div className="product-auth-item">
                      <small>Missing certificates</small>
                      <strong>{missingUnitCount}</strong>
                    </div>
                  </div>

                  <div className="product-auth-toolbar">
                    <p>
                      Save the product to auto-issue any missing certificates. Extra certificates are preserved even if stock later decreases so sold units remain verifiable.
                    </p>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => syncAuthenticityUnits(id, formData.name, Number(formData.stock_quantity))}
                      disabled={syncingUnits}
                    >
                      <PlusCircle size={18} />
                      {syncingUnits ? 'Syncing Certificates...' : 'Generate Missing Certificates'}
                    </button>
                  </div>

                  {authError ? (
                    <div className="product-auth-empty">
                      Authenticity registry unavailable. Run the SQL patch for `product_auth_units`, then refresh this editor. Current error: {authError}
                    </div>
                  ) : null}

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
                                  <DownloadSimple size={18} />
                                  {downloadingUnitId === unit.id ? 'Downloading...' : 'Download QR'}
                                </button>
                                <a
                                  className="btn-secondary"
                                  href={verificationUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ArrowSquareOut size={18} />
                                  Open Verify Page
                                </a>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : !authError ? (
                    <div className="product-auth-empty">
                      No unit certificates have been issued yet. Save the product or generate the missing certificates to create QR-based authenticity records for each unit.
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="product-auth-empty">
                  Save the product once to create its model ID and issue one downloadable authenticity certificate per stock unit.
                </div>
              )}
            </div>
          </section>

          <section className="settings-panel product-editor-panel">
            <div className="settings-panel-header">
              <div>
                <p className="settings-panel-eyebrow">Commerce</p>
                <h3>Pricing & Inventory</h3>
                <p>Manage price, stock, and storefront visibility safely.</p>
              </div>
            </div>
            <div className="settings-panel-body product-editor-grid">
              <Field label="Price (INR)">
                <input type="number" name="price" value={formData.price} onChange={handleChange} min="0" required />
              </Field>
              <Field label="Stock Quantity">
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </Field>
            </div>
          </section>

          <section className="settings-panel product-editor-panel">
            <div className="settings-panel-header">
              <div>
                <p className="settings-panel-eyebrow">Catalog</p>
                <h3>Organization</h3>
                <p>Keep the product indexed correctly for discovery and filtering.</p>
              </div>
            </div>
            <div className="settings-panel-body product-editor-grid">
              <Field label="Category">
                <select name="category" value={formData.category} onChange={handleChange}>
                  <option value="Wall Clocks">Wall Clocks</option>
                  <option value="Desk Clocks">Desk Clocks</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </Field>
              <Field label="Tags" hint="Separate tags with commas.">
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="minimalist, walnut, limited"
                />
              </Field>
            </div>
          </section>

          <section className="settings-panel product-editor-panel">
            <div className="settings-panel-header">
              <div>
                <p className="settings-panel-eyebrow">Launch State</p>
                <h3>Visibility & Drops</h3>
                <p>Control whether this product is live and whether it belongs to a limited drop.</p>
              </div>
            </div>
            <div className="settings-panel-body">
              <div className="settings-toggle-stack">
                <label className="settings-toggle-row">
                  <div className="settings-toggle-copy">
                    <strong>{formData.is_live ? 'Live on storefront' : 'Draft only'}</strong>
                    <small>Turn this on when the product should appear to customers.</small>
                  </div>
                  <div className="settings-toggle-control">
                    <span className={`settings-toggle-state ${formData.is_live ? 'is-on' : 'is-off'}`}>
                      {formData.is_live ? 'On' : 'Off'}
                    </span>
                    <input type="checkbox" name="is_live" checked={formData.is_live} onChange={handleChange} />
                  </div>
                </label>

                <label className="settings-toggle-row">
                  <div className="settings-toggle-copy">
                    <strong>{formData.is_limited_drop ? 'Limited drop enabled' : 'Standard release'}</strong>
                    <small>Use this to enable the countdown timer and drop framing on the product page.</small>
                  </div>
                  <div className="settings-toggle-control">
                    <span className={`settings-toggle-state ${formData.is_limited_drop ? 'is-on' : 'is-off'}`}>
                      {formData.is_limited_drop ? 'On' : 'Off'}
                    </span>
                    <input
                      type="checkbox"
                      name="is_limited_drop"
                      checked={formData.is_limited_drop}
                      onChange={handleChange}
                    />
                  </div>
                </label>
              </div>

              {formData.is_limited_drop ? (
                <div className="product-editor-drop-date">
                  <Field label="Drop Date & Time" hint="This powers the product countdown timer.">
                    <input type="datetime-local" name="drop_date" value={formData.drop_date} onChange={handleChange} />
                  </Field>
                </div>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
};

export default ProductForm;
