import { useEffect, useMemo, useState } from 'react';
import {
  FloppyDisk,
  Storefront,
  CreditCard,
  Truck,
  BookOpen,
  CheckCircle,
  WarningCircle,
  X,
  Warning,
} from '@phosphor-icons/react';
import { supabase } from '../lib/supabase';

import AdminPageHeader from '../components/common/AdminPageHeader';
import StatCard from '../components/common/StatCard';
import ToggleSwitch from '../components/common/ToggleSwitch';
import FormField from '../components/common/FormField';
import { formatCurrency } from '../config/adminConfig';

const defaultSettings = {
  maintenance_mode: false,
  cod_enabled: true,
  cod_fee: 100,
  free_shipping_threshold: 50000,
  store_name: 'CHRONYX',
  contact_email: 'hello@chronyx.in',
  whatsapp_number: '',
  express_shipping_enabled: false,
  express_shipping_fee: 1500,
  upi_enabled: true,
  card_enabled: true,
  netbanking_enabled: true,
  show_journal: false,
};

const paymentMethods = [
  {
    key: 'upi_enabled',
    label: 'UPI Payments (GPay, PhonePe, Paytm)',
    description: 'Instant zero-friction mobile checkout for customers.',
  },
  {
    key: 'card_enabled',
    label: 'Debit & Credit Cards (Visa, Mastercard, RuPay)',
    description: 'Accept standard domestic and international cards.',
  },
  {
    key: 'netbanking_enabled',
    label: 'Net Banking (Direct Bank Transfer)',
    description: 'Permit direct payment via major banking institutions.',
  },
  {
    key: 'cod_enabled',
    label: 'Cash on Delivery (COD)',
    description: 'Enable customers to pay upon package receipt.',
  },
];

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('settings').select('*').eq('key', 'store_settings').single();
      if (error && error.code !== 'PGRST116') throw error;

      if (data?.value) {
        setSettings((prev) => ({ ...prev, ...data.value }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error.message);
      setFeedback({ type: 'error', message: `Failed to load settings: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleToggle = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const { error } = await supabase.from('settings').upsert({
        key: 'store_settings',
        value: {
          ...settings,
          cod_fee: Number(settings.cod_fee || 0),
          free_shipping_threshold: Number(settings.free_shipping_threshold || 0),
          express_shipping_fee: Number(settings.express_shipping_fee || 0),
        },
      });
      if (error) throw error;
      setFeedback({ type: 'success', message: 'Store settings saved successfully.' });
    } catch (error) {
      setFeedback({ type: 'error', message: `Error saving settings: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  const enabledPayments = useMemo(
    () =>
      [settings.upi_enabled, settings.card_enabled, settings.netbanking_enabled, settings.cod_enabled].filter(Boolean)
        .length,
    [settings]
  );

  if (loading) {
    return (
      <div className="admin-page-container">
        <AdminPageHeader
          eyebrow="Configuration"
          title="Settings"
          description="Manage store identity, delivery rules, payment options, and feature availability."
        />
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
          Loading store settings...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container" style={{ display: 'grid', gap: '24px' }}>
      <AdminPageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Manage store identity, delivery pricing rules, checkout payment methods, and storefront feature availability."
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <FloppyDisk size={16} />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
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

      {settings.maintenance_mode && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            borderRadius: 'var(--admin-radius-md, 8px)',
            background: 'var(--admin-danger-subtle)',
            border: '1px solid var(--admin-danger)',
            color: 'var(--admin-danger)',
            fontSize: '0.88rem',
            fontWeight: 500,
          }}
        >
          <Warning size={20} weight="bold" />
          <div>
            <strong>Maintenance Mode is Active:</strong> The customer-facing storefront is currently paused and displays a temporary maintenance screen.
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Storefront Status"
          value={settings.maintenance_mode ? 'Paused' : 'Active Live'}
          description={settings.maintenance_mode ? 'Maintenance mode on' : 'Open to all visitors'}
          icon={Storefront}
          tone={settings.maintenance_mode ? 'danger' : 'success'}
        />
        <StatCard
          label="Payment Methods"
          value={`${enabledPayments} / 4`}
          description="Enabled checkout gateways"
          icon={CreditCard}
          tone={enabledPayments > 0 ? 'neutral' : 'warning'}
        />
        <StatCard
          label="Free Delivery"
          value={formatCurrency(Number(settings.free_shipping_threshold || 0))}
          description="Order qualification threshold"
          icon={Truck}
          tone="neutral"
        />
        <StatCard
          label="Journal Feature"
          value={settings.show_journal ? 'Available' : 'Disabled'}
          description="Master blog toggle"
          icon={BookOpen}
          tone={settings.show_journal ? 'info' : 'neutral'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', alignItems: 'start' }}>
        {/* COLUMN 1 */}
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* STORE IDENTITY */}
          <section className="card" style={{ padding: '24px' }}>
            <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--admin-border)', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 4px', color: 'var(--admin-text)' }}>
                Store Identity &amp; Contact
              </h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--admin-text-muted)' }}>
                Brand details used in transactional emails, order documents, and support channels.
              </p>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <FormField label="Store / Brand Name" required id="st-name">
                <input
                  id="st-name"
                  type="text"
                  name="store_name"
                  value={settings.store_name}
                  onChange={handleFieldChange}
                  placeholder="e.g. Acme Studio"
                />
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <FormField label="Customer Support Email" required id="st-email">
                  <input
                    id="st-email"
                    type="email"
                    name="contact_email"
                    value={settings.contact_email}
                    onChange={handleFieldChange}
                    placeholder="support@yourstore.com"
                  />
                </FormField>

                <FormField label="WhatsApp Support Number" hint="With country code, no symbols" id="st-wa">
                  <input
                    id="st-wa"
                    type="text"
                    name="whatsapp_number"
                    value={settings.whatsapp_number}
                    onChange={handleFieldChange}
                    placeholder="919876543210"
                  />
                </FormField>
              </div>
            </div>
          </section>

          {/* SHIPPING & DELIVERY PRICING */}
          <section className="card" style={{ padding: '24px' }}>
            <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--admin-border)', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 4px', color: 'var(--admin-text)' }}>
                Delivery Pricing &amp; Thresholds
              </h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--admin-text-muted)' }}>
                Control shipping rates, COD fees, and free delivery thresholds calculated at checkout.
              </p>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <FormField
                label="Free Standard Shipping Threshold (INR)"
                hint="Orders totaling at or above this amount automatically receive complimentary delivery."
                id="st-free-ship"
              >
                <input
                  id="st-free-ship"
                  type="number"
                  min="0"
                  name="free_shipping_threshold"
                  value={settings.free_shipping_threshold}
                  onChange={handleFieldChange}
                />
              </FormField>

              {settings.express_shipping_enabled && (
                <FormField
                  label="Express Shipping Fee (INR)"
                  hint="Additional surcharge applied when customer selects priority express delivery."
                  id="st-exp-fee"
                >
                  <input
                    id="st-exp-fee"
                    type="number"
                    min="0"
                    name="express_shipping_fee"
                    value={settings.express_shipping_fee}
                    onChange={handleFieldChange}
                  />
                </FormField>
              )}

              {settings.cod_enabled && (
                <FormField
                  label="COD Handling Fee (INR)"
                  hint="Fixed convenience fee added to Cash on Delivery orders."
                  id="st-cod-fee"
                >
                  <input
                    id="st-cod-fee"
                    type="number"
                    min="0"
                    name="cod_fee"
                    value={settings.cod_fee}
                    onChange={handleFieldChange}
                  />
                </FormField>
              )}
            </div>
          </section>
        </div>

        {/* COLUMN 2 */}
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* OPERATIONAL SWITCHES */}
          <section className="card" style={{ padding: '24px' }}>
            <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--admin-border)', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 4px', color: 'var(--admin-text)' }}>
                Operational &amp; Feature Availability
              </h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--admin-text-muted)' }}>
                Toggle major storefront features, delivery modes, and maintenance status.
              </p>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--admin-radius-md, 8px)',
                  background: 'var(--admin-surface-hover)',
                  border: '1px solid var(--admin-border)',
                }}
              >
                <ToggleSwitch
                  id="toggle-express-ship"
                  checked={settings.express_shipping_enabled}
                  onChange={(val) => handleToggle('express_shipping_enabled', val)}
                  label="Offer Express Shipping"
                  description="Displays an expedited shipping method choice during checkout."
                />
              </div>

              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--admin-radius-md, 8px)',
                  background: 'var(--admin-surface-hover)',
                  border: '1px solid var(--admin-border)',
                }}
              >
                <ToggleSwitch
                  id="toggle-journal-master"
                  checked={settings.show_journal}
                  onChange={(val) => handleToggle('show_journal', val)}
                  label="Enable Storefront Journal Feature"
                  description="Master switch controlling whether the /blog and /journal routes and default links are accessible."
                />
              </div>

              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--admin-radius-md, 8px)',
                  background: settings.maintenance_mode ? 'var(--admin-danger-subtle)' : 'var(--admin-surface-hover)',
                  border: `1px solid ${settings.maintenance_mode ? 'var(--admin-danger)' : 'var(--admin-border)'}`,
                }}
              >
                <ToggleSwitch
                  id="toggle-maintenance"
                  checked={settings.maintenance_mode}
                  onChange={(val) => handleToggle('maintenance_mode', val)}
                  label="Maintenance Mode"
                  description="Pause storefront access for regular visitors while maintenance or catalog overhaul is performed."
                />
              </div>
            </div>
          </section>

          {/* CHECKOUT PAYMENT METHODS */}
          <section className="card" style={{ padding: '24px' }}>
            <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--admin-border)', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 4px', color: 'var(--admin-text)' }}>
                Accepted Payment Methods
              </h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--admin-text-muted)' }}>
                Toggle which payment choices customers see when completing their purchase.
              </p>
            </div>

            <div style={{ display: 'grid', gap: '14px' }}>
              {paymentMethods.map((pm) => (
                <div
                  key={pm.key}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--admin-radius-md, 8px)',
                    background: 'var(--admin-surface-hover)',
                    border: '1px solid var(--admin-border)',
                  }}
                >
                  <ToggleSwitch
                    id={`toggle-${pm.key}`}
                    checked={Boolean(settings[pm.key])}
                    onChange={(val) => handleToggle(pm.key, val)}
                    label={pm.label}
                    description={pm.description}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
