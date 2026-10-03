import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Plus,
  Tag,
  EnvelopeSimple,
  PencilSimple,
  Users,
  CheckCircle,
  WarningCircle,
  X,
  PaperPlaneTilt,
  Percent,
  ToggleLeft,
  ToggleRight,
  MagnifyingGlass,
} from '@phosphor-icons/react';

import AdminPageHeader from '../components/common/AdminPageHeader';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import ToggleSwitch from '../components/common/ToggleSwitch';
import FormField from '../components/common/FormField';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';

const defaultCouponForm = {
  id: '',
  code: '',
  discount_percent: 10,
  max_uses: '',
  expires_at: '',
  is_active: true,
};

const defaultBlastForm = {
  segment: 'all',
  subject: '',
  message: '',
  ctaLabel: '',
  ctaUrl: '',
};

const Marketing = () => {
  const [coupons, setCoupons] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const [couponForm, setCouponForm] = useState(defaultCouponForm);
  const [couponEditorOpen, setCouponEditorOpen] = useState(false);
  const [couponSaving, setCouponSaving] = useState(false);
  const [couponError, setCouponError] = useState('');

  const [blastForm, setBlastForm] = useState(defaultBlastForm);
  const [blastEditorOpen, setBlastEditorOpen] = useState(false);
  const [blastSending, setBlastSending] = useState(false);
  const [blastError, setBlastError] = useState('');

  const [couponSearch, setCouponSearch] = useState('');
  const [subscriberSearch, setSubscriberSearch] = useState('');

  useEffect(() => {
    fetchMarketingData();
  }, []);

  const fetchMarketingData = async () => {
    setLoading(true);
    try {
      const { data: couponsData, error: couponsErr } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (couponsErr) throw couponsErr;

      const { data: waitlistData, error: waitlistErr } = await supabase
        .from('waitlist')
        .select('*')
        .order('created_at', { ascending: false });
      if (waitlistErr) throw waitlistErr;

      setCoupons(couponsData || []);
      setWaitlist(waitlistData || []);
    } catch (error) {
      console.error('Error fetching marketing data:', error.message);
      setFeedback({ type: 'error', message: `Failed to load marketing data: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const couponSummary = useMemo(() => {
    const active = coupons.filter((coupon) => coupon.is_active).length;
    const expired = coupons.length - active;
    return { active, expired };
  }, [coupons]);

  const waitlistSummary = useMemo(() => {
    const newsletter = waitlist.filter((subscriber) => subscriber.is_newsletter).length;
    const product = waitlist.length - newsletter;
    return { newsletter, product };
  }, [waitlist]);

  const filteredCoupons = useMemo(() => {
    if (!couponSearch.trim()) return coupons;
    const q = couponSearch.toLowerCase();
    return coupons.filter((c) => (c.code || '').toLowerCase().includes(q));
  }, [coupons, couponSearch]);

  const filteredWaitlist = useMemo(() => {
    if (!subscriberSearch.trim()) return waitlist;
    const q = subscriberSearch.toLowerCase();
    return waitlist.filter((s) => (s.email || '').toLowerCase().includes(q));
  }, [waitlist, subscriberSearch]);

  const openNewCouponForm = () => {
    setCouponForm(defaultCouponForm);
    setCouponError('');
    setCouponEditorOpen(true);
  };

  const openEditCouponForm = (coupon) => {
    setCouponForm({
      id: coupon.id,
      code: coupon.code || '',
      discount_percent:
        coupon.discount_percent ??
        (coupon.discount_type === 'percentage' || coupon.type === 'percent'
          ? Number(coupon.discount_value) || 10
          : 10),
      max_uses: coupon.max_uses ?? '',
      expires_at: coupon.expires_at || coupon.expiry_date
        ? new Date(coupon.expires_at || coupon.expiry_date).toISOString().slice(0, 16)
        : '',
      is_active: Boolean(coupon.is_active),
    });
    setCouponError('');
    setCouponEditorOpen(true);
  };

  const closeCouponForm = () => {
    setCouponEditorOpen(false);
    setCouponForm(defaultCouponForm);
    setCouponError('');
  };

  const openBlastEditor = () => {
    setBlastForm(defaultBlastForm);
    setBlastError('');
    setBlastEditorOpen(true);
  };

  const closeBlastEditor = () => {
    setBlastEditorOpen(false);
    setBlastForm(defaultBlastForm);
    setBlastError('');
  };

  const handleCouponFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    setCouponForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleBlastFieldChange = (event) => {
    const { name, value } = event.target;
    setBlastForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCouponSave = async (event) => {
    event.preventDefault();
    if (!couponForm.code.trim()) {
      setCouponError('Coupon code is required.');
      return;
    }

    const discountPercent = Number(couponForm.discount_percent);
    if (!Number.isFinite(discountPercent) || discountPercent <= 0) {
      setCouponError('Discount percent must be greater than 0.');
      return;
    }

    setCouponSaving(true);
    setCouponError('');
    try {
      const normalizedExpiry = couponForm.expires_at ? new Date(couponForm.expires_at).toISOString() : null;
      const payload = {
        code: couponForm.code.trim().toUpperCase(),
        discount_percent: discountPercent,
        discount_type: 'percentage',
        discount_value: discountPercent,
        type: 'percent',
        is_active: couponForm.is_active,
        max_uses: couponForm.max_uses === '' ? null : Number(couponForm.max_uses),
        min_order_amount: 0,
        one_per_customer: false,
        expires_at: normalizedExpiry,
        expiry_date: normalizedExpiry,
      };

      if (couponForm.id) {
        payload.id = couponForm.id;
      } else {
        payload.times_used = 0;
      }

      const { error } = await supabase.from('coupons').upsert(payload);
      if (error) throw error;

      await fetchMarketingData();
      closeCouponForm();
      setFeedback({
        type: 'success',
        message: couponForm.id ? 'Coupon updated successfully.' : 'Coupon created successfully.',
      });
    } catch (error) {
      setCouponError(`Error saving coupon: ${error.message}`);
    } finally {
      setCouponSaving(false);
    }
  };

  const handleCouponStatusToggle = async (coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !coupon.is_active })
        .eq('id', coupon.id);

      if (error) throw error;
      await fetchMarketingData();
      setFeedback({
        type: 'success',
        message: `Coupon "${coupon.code}" ${coupon.is_active ? 'disabled' : 'enabled'}.`,
      });
    } catch (error) {
      setFeedback({ type: 'error', message: `Error updating coupon status: ${error.message}` });
    }
  };

  const handleSendBlast = async (event) => {
    event.preventDefault();

    if (!blastForm.subject.trim()) {
      setBlastError('Subject is required.');
      return;
    }
    if (!blastForm.message.trim()) {
      setBlastError('Message body is required.');
      return;
    }

    setBlastSending(true);
    setBlastError('');
    try {
      const { data, error } = await supabase.functions.invoke('send-marketing-email', {
        body: {
          segment: blastForm.segment,
          subject: blastForm.subject.trim(),
          message: blastForm.message.trim(),
          ctaLabel: blastForm.ctaLabel.trim(),
          ctaUrl: blastForm.ctaUrl.trim(),
        },
      });

      if (error) throw error;

      setFeedback({
        type: 'success',
        message: `Email broadcast dispatched successfully to ${data?.recipients || 'selected'} recipient(s).`,
      });
      closeBlastEditor();
    } catch (error) {
      setBlastError(
        `Email send failed: ${error.message}. Ensure the 'send-marketing-email' Supabase Edge Function is deployed.`
      );
    } finally {
      setBlastSending(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page-container">
        <AdminPageHeader
          eyebrow="Growth & Engagement"
          title="Marketing & Promotions"
          description="Review discount coupons, audience growth, and send broadcast updates."
        />
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
          Loading marketing metrics...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container" style={{ display: 'grid', gap: '24px' }}>
      <AdminPageHeader
        eyebrow="Growth & Engagement"
        title="Marketing & Promotions"
        description="Review coupons, manage promotional campaigns, and inspect customer audience growth."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={openBlastEditor}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <EnvelopeSimple size={16} />
              <span>Send Email Blast</span>
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={openNewCouponForm}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} weight="bold" />
              <span>New Coupon</span>
            </button>
          </div>
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
          label="Active Coupons"
          value={`${couponSummary.active} / ${coupons.length}`}
          description={`${couponSummary.expired} inactive or expired`}
          icon={Tag}
          tone={couponSummary.active > 0 ? 'success' : 'neutral'}
        />
        <StatCard
          label="Audience Subscribers"
          value={waitlist.length}
          description="Total signups across site"
          icon={Users}
          tone="info"
        />
        <StatCard
          label="Audience Segments"
          value={`${waitlistSummary.newsletter} / ${waitlistSummary.product}`}
          description="Newsletter vs product waitlist"
          icon={EnvelopeSimple}
          tone="neutral"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', alignItems: 'start' }}>
        {/* DISCOUNT CODES CARD */}
        <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
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
                Discount Codes
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                Track active offers and checkout promotions.
              </p>
            </div>
            <div style={{ position: 'relative', width: '180px' }}>
              <MagnifyingGlass
                size={14}
                style={{
                  position: 'absolute',
                  left: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--admin-text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Filter codes..."
                value={couponSearch}
                onChange={(e) => setCouponSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 10px 5px 28px',
                  fontSize: '0.82rem',
                  borderRadius: 'var(--admin-radius-sm, 6px)',
                  border: '1px solid var(--admin-border)',
                  background: 'var(--admin-surface)',
                  color: 'var(--admin-text)',
                }}
              />
            </div>
          </div>

          {filteredCoupons.length === 0 ? (
            <div style={{ padding: '36px 20px' }}>
              <EmptyState
                icon={Tag}
                title={couponSearch ? 'No matching coupons' : 'No coupons yet'}
                description={
                  couponSearch
                    ? `No discount codes match "${couponSearch}".`
                    : 'Create promotional discount codes for sales campaigns or customer care.'
                }
                action={
                  couponSearch ? (
                    <button className="btn-secondary" onClick={() => setCouponSearch('')}>
                      Clear Search
                    </button>
                  ) : (
                    <button className="btn-primary" onClick={openNewCouponForm}>
                      <Plus size={16} /> New Coupon
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
                    <th style={{ padding: '10px 14px', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Code</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Discount</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Usage</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Status</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoupons.map((coupon) => (
                    <tr
                      key={coupon.id}
                      style={{ borderBottom: '1px solid var(--admin-border)', transition: 'background 0.15s ease' }}
                    >
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Tag size={14} style={{ color: 'var(--admin-text-muted)' }} />
                          <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.88rem', color: 'var(--admin-text)' }}>
                            {coupon.code}
                          </span>
                        </div>
                        {coupon.expires_at && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '2px' }}>
                            Exp: {new Date(coupon.expires_at).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--admin-text)' }}>
                          {coupon.discount_percent ? `${coupon.discount_percent}%` : 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.84rem', color: 'var(--admin-text-muted)' }}>
                        {coupon.max_uses
                          ? `${coupon.times_used || 0} / ${coupon.max_uses}`
                          : `${coupon.times_used || 0} used`}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <StatusBadge status={coupon.is_active ? 'success' : 'neutral'}>
                          {coupon.is_active ? 'Active' : 'Disabled'}
                        </StatusBadge>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => openEditCouponForm(coupon)}
                            style={{ padding: '5px 8px', fontSize: '0.78rem' }}
                            title="Edit coupon"
                          >
                            <PencilSimple size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => handleCouponStatusToggle(coupon)}
                            style={{ padding: '5px 8px', fontSize: '0.78rem' }}
                            title={coupon.is_active ? 'Disable coupon' : 'Enable coupon'}
                          >
                            {coupon.is_active ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* SUBSCRIBERS & WAITLIST CARD */}
        <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
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
                Audience &amp; Waitlist
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                Newsletter subscribers and back-in-stock notifications.
              </p>
            </div>
            <div style={{ position: 'relative', width: '180px' }}>
              <MagnifyingGlass
                size={14}
                style={{
                  position: 'absolute',
                  left: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--admin-text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Filter emails..."
                value={subscriberSearch}
                onChange={(e) => setSubscriberSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 10px 5px 28px',
                  fontSize: '0.82rem',
                  borderRadius: 'var(--admin-radius-sm, 6px)',
                  border: '1px solid var(--admin-border)',
                  background: 'var(--admin-surface)',
                  color: 'var(--admin-text)',
                }}
              />
            </div>
          </div>

          {filteredWaitlist.length === 0 ? (
            <div style={{ padding: '36px 20px' }}>
              <EmptyState
                icon={Users}
                title={subscriberSearch ? 'No matching subscribers' : 'No subscribers yet'}
                description={
                  subscriberSearch
                    ? `No audience members match "${subscriberSearch}".`
                    : 'Customer waitlist entries and newsletter subscribers will appear here.'
                }
              />
            </div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto' }}>
              <table className="marketing-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--admin-surface-hover)', zIndex: 1 }}>
                  <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
                    <th style={{ padding: '10px 14px', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Email Address</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Segment</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Source</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWaitlist.map((subscriber) => (
                    <tr
                      key={subscriber.id}
                      style={{ borderBottom: '1px solid var(--admin-border)', transition: 'background 0.15s ease' }}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: 500, color: 'var(--admin-text)', fontSize: '0.86rem' }}>
                        {subscriber.email}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <StatusBadge status={subscriber.is_newsletter ? 'info' : 'warning'}>
                          {subscriber.is_newsletter ? 'Newsletter' : 'Product Waitlist'}
                        </StatusBadge>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                        {subscriber.product_id ? 'Product drop' : 'Footer signup'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                        {new Date(subscriber.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Coupon Modal Editor */}
      <Modal
        isOpen={couponEditorOpen}
        onClose={closeCouponForm}
        title={couponForm.id ? 'Edit Coupon' : 'Create Discount Coupon'}
        maxWidth="520px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button type="button" className="btn-secondary" onClick={closeCouponForm} disabled={couponSaving}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleCouponSave} disabled={couponSaving}>
              {couponSaving ? 'Saving...' : couponForm.id ? 'Save Changes' : 'Create Coupon'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleCouponSave} style={{ display: 'grid', gap: '16px' }}>
          {couponError && (
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
              <span>{couponError}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <FormField label="Coupon Code" required hint="e.g. WELCOME10" id="cpn-code">
              <input
                id="cpn-code"
                type="text"
                name="code"
                value={couponForm.code}
                onChange={handleCouponFieldChange}
                placeholder="WELCOME10"
                style={{ textTransform: 'uppercase' }}
                required
              />
            </FormField>

            <FormField label="Discount Percentage" required hint="Percentage off order total" id="cpn-pct">
              <input
                id="cpn-pct"
                type="number"
                min="1"
                max="100"
                name="discount_percent"
                value={couponForm.discount_percent}
                onChange={handleCouponFieldChange}
                required
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <FormField label="Usage Cap" hint="Leave empty for unlimited uses" id="cpn-uses">
              <input
                id="cpn-uses"
                type="number"
                min="1"
                name="max_uses"
                value={couponForm.max_uses}
                onChange={handleCouponFieldChange}
                placeholder="Unlimited"
              />
            </FormField>

            <FormField label="Expiry Date" hint="Optional expiry threshold" id="cpn-exp">
              <input
                id="cpn-exp"
                type="datetime-local"
                name="expires_at"
                value={couponForm.expires_at}
                onChange={handleCouponFieldChange}
              />
            </FormField>
          </div>

          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--admin-radius-md, 8px)',
              background: 'var(--admin-surface-hover)',
              border: '1px solid var(--admin-border)',
            }}
          >
            <ToggleSwitch
              label="Coupon is Active"
              description="Active coupons can immediately be redeemed at checkout"
              checked={couponForm.is_active}
              onChange={(val) => setCouponForm((prev) => ({ ...prev, is_active: val }))}
            />
          </div>
        </form>
      </Modal>

      {/* Broadcast Email Modal */}
      <Modal
        isOpen={blastEditorOpen}
        onClose={closeBlastEditor}
        title="Send Campaign Broadcast Email"
        maxWidth="580px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button type="button" className="btn-secondary" onClick={closeBlastEditor} disabled={blastSending}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSendBlast}
              disabled={blastSending}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <PaperPlaneTilt size={16} />
              <span>{blastSending ? 'Sending...' : 'Send Broadcast'}</span>
            </button>
          </div>
        }
      >
        <form onSubmit={handleSendBlast} style={{ display: 'grid', gap: '16px' }}>
          {blastError && (
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
              <span>{blastError}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <FormField label="Recipient Segment" id="bl-seg">
              <select id="bl-seg" name="segment" value={blastForm.segment} onChange={handleBlastFieldChange}>
                <option value="all">All subscribers &amp; waitlists ({waitlist.length})</option>
                <option value="subscribers">General subscribers only ({waitlistSummary.newsletter})</option>
                <option value="waitlist">Product waitlist only ({waitlistSummary.product})</option>
              </select>
            </FormField>

            <FormField label="Button CTA Text" hint="Optional action button" id="bl-cta-lbl">
              <input
                id="bl-cta-lbl"
                type="text"
                name="ctaLabel"
                value={blastForm.ctaLabel}
                onChange={handleBlastFieldChange}
                placeholder="e.g. Explore Collection"
              />
            </FormField>
          </div>

          <FormField label="Email Subject Line" required id="bl-subj">
            <input
              id="bl-subj"
              type="text"
              name="subject"
              value={blastForm.subject}
              onChange={handleBlastFieldChange}
              placeholder="e.g. New Seasonal Collection Is Live"
              required
            />
          </FormField>

          <FormField label="Campaign Message" required hint="Write your announcement text" id="bl-msg">
            <textarea
              id="bl-msg"
              rows={5}
              name="message"
              value={blastForm.message}
              onChange={handleBlastFieldChange}
              placeholder="Share the announcement details with your audience..."
              required
            />
          </FormField>

          <FormField label="Button Destination URL" hint="Where the CTA button redirects" id="bl-cta-url">
            <input
              id="bl-cta-url"
              type="url"
              name="ctaUrl"
              value={blastForm.ctaUrl}
              onChange={handleBlastFieldChange}
              placeholder="https://yourstore.com/shop"
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
};

export default Marketing;
