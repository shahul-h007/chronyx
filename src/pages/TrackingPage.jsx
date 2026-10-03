import React, { useMemo, useState } from 'react';
import { CheckCircle, Package, Truck } from '@phosphor-icons/react';
import { useLocation } from 'react-router-dom';
import SEO from '../components/SEO';
import { siteConfig } from '../config/siteConfig';

const buildTimeline = (orderId) => {
  const now = new Date();
  const confirmedAt = new Date(now.getTime() - 36 * 60 * 60 * 1000);
  const dispatchAt = new Date(now.getTime() - 8 * 60 * 60 * 1000);

  return [
    {
      key: 'confirmed',
      title: 'Order Confirmed',
      subtitle: confirmedAt.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      }),
      state: 'done',
      icon: CheckCircle,
    },
    {
      key: 'dispatch',
      title: 'Packed for Dispatch',
      subtitle: dispatchAt.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      }),
      state: 'active',
      icon: Truck,
    },
    {
      key: 'delivery',
      title: 'Delivered',
      subtitle: `Pending final delivery scan for ${orderId.slice(0, 8).toUpperCase()}`,
      state: 'pending',
      icon: Package,
    },
  ];
};

function TrackingPage() {
  const location = useLocation();
  const seededOrderId = location.state?.orderId || '';
  const [orderId, setOrderId] = useState(seededOrderId);
  const [tracking, setTracking] = useState(Boolean(seededOrderId));

  const normalizedId = orderId.trim();
  const timeline = useMemo(
    () => (tracking && normalizedId ? buildTimeline(normalizedId) : []),
    [normalizedId, tracking],
  );

  const handleTrack = (event) => {
    event.preventDefault();
    setTracking(Boolean(orderId.trim()));
  };

  return (
    <div className="page-stack">
      <SEO
        title="Track Order"
        description={`Track your ${siteConfig.name} order status, dispatch progress, and delivery timeline.`}
        path="/track"
      />
      <section className="page-header-panel">
        <p className="label">Order Status</p>
        <h1>Track your delivery</h1>
      </section>

      <section className="checkout-layout">
        <form className="checkout-form-panel" onSubmit={handleTrack}>
          <div className="section-heading">
            <h2>Enter your order ID</h2>
            <p className="hero-text">Use the order number from your confirmation email or invoice.</p>
          </div>
          <div className="form-grid">
            <label className="full-span">
              Order ID
              <input
                type="text"
                required
                placeholder="e.g. KRX-2026-1A2B3C4D"
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
              />
            </label>
            <button type="submit" className="primary-btn full-span">
              Track Order
            </button>
          </div>
        </form>

        {tracking && normalizedId ? (
          <aside className="summary-panel">
            <p className="label">Status for {normalizedId.toUpperCase()}</p>
            <h3>In Transit</h3>

            <div className="tracking-timeline">
              {timeline.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.key} className={`tracking-step ${step.state}`}>
                    <div className="tracking-step-icon">
                      <Icon size={16} weight={step.state === 'done' ? 'fill' : 'regular'} />
                    </div>
                    <div className="tracking-step-copy">
                      <strong>{step.title}</strong>
                      <p>{step.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        ) : null}
      </section>
    </div>
  );
}

export default TrackingPage;
