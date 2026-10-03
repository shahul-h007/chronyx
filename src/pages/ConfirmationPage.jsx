import React, { useEffect } from 'react';
import { CheckCircle, DownloadSimple, Package, Truck } from '@phosphor-icons/react';
import { Link, useLocation } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InvoicePDF from '../components/pdf/InvoicePDF';
import SEO from '../components/SEO';
import { trackPurchase } from '../lib/tracking';
import { siteConfig } from '../config/siteConfig';

function ConfirmationPage() {
  const location = useLocation();
  const order = location.state?.order || {};

  const shortId = order.id ? order.id.slice(0, 8).toUpperCase() : 'XXXX';
  const displayId = `KRX-${new Date().getFullYear()}-${shortId}`;
  const orderEmail = order.customer_email || 'your inbox';

  useEffect(() => {
    if (order && order.id) {
      trackPurchase(order.id, order.items || [], order.total);
    }
    
    const event = new CustomEvent('chronyx-notice', {
      detail: order.customer_email
        ? `Confirmation details queued for ${order.customer_email}.`
        : 'Confirmation details are ready on this page.',
    });
    window.dispatchEvent(event);
  }, [order.id, order.customer_email]);

  return (
    <div className="page-stack">
      <SEO
        title="Order Confirmed"
        description={`Your ${siteConfig.name} order confirmation, invoice access, and delivery tracking details.`}
        path="/confirmation"
      />
      <section className="confirmation-panel commerce-confirmation-panel">
        <CheckCircle size={68} weight="duotone" />
        <p className="label">Order Confirmed</p>
        <h1>Your {siteConfig.name} order is secured.</h1>
        <p>
          Thank you for choosing {siteConfig.name}. Your order #{displayId} is now being prepared for
          dispatch, and your receipt is ready below. A confirmation message should arrive at{' '}
          {orderEmail}.
        </p>

        <div className="confirmation-highlight-grid">
          <div className="confirmation-highlight">
            <Package size={20} weight="duotone" />
            <span>Invoice available immediately</span>
          </div>
          <div className="confirmation-highlight">
            <Truck size={20} weight="duotone" />
            <span>Tracking timeline ready on the next step</span>
          </div>
        </div>

        <div className="confirmation-actions">
          {order.id ? (
            <PDFDownloadLink
              document={<InvoicePDF order={order} />}
              fileName={`${siteConfig.name}_Invoice_${displayId}.pdf`}
              style={{ textDecoration: 'none' }}
            >
              {({ loading }) => (
                <button className="primary-btn" disabled={loading}>
                  <DownloadSimple size={18} />
                  {loading ? 'Generating invoice...' : 'Download GST Invoice'}
                </button>
              )}
            </PDFDownloadLink>
          ) : (
            <button className="primary-btn" disabled>
              <DownloadSimple size={18} />
              Invoice Unavailable
            </button>
          )}

          <Link className="secondary-btn" to="/track" state={order.id ? { orderId: order.id } : undefined}>
            Track Order
          </Link>
        </div>
      </section>
    </div>
  );
}

export default ConfirmationPage;
