import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  Copy,
  DownloadSimple,
  MapPin,
  Package,
  Printer,
  QrCode,
  ShieldCheck,
  User,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import { pdf } from '@react-pdf/renderer';
import { supabase } from '../lib/supabase';
import { adminConfig } from '../config/adminConfig';
import AdminPageHeader from '../components/common/AdminPageHeader';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import PackingSlipPDF from '../components/pdf/PackingSlipPDF';
import AuthenticityCertificatePDF from '../components/pdf/AuthenticityCertificatePDF';
import AuthenticityQrSheetPDF from '../components/pdf/AuthenticityQrSheetPDF';

const EDITABLE_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

function getStatusTone(status) {
  switch (String(status || '').toLowerCase()) {
    case 'delivered':
    case 'completed':
      return 'success';
    case 'shipped':
      return 'info';
    case 'processing':
    case 'pending':
      return 'warning';
    case 'cancelled':
    case 'refunded':
      return 'danger';
    default:
      return 'neutral';
  }
}

function formatStatusText(status) {
  if (!status) return 'Pending';
  return String(status).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatOrderDate(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatOrderTime(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function PaymentMethodBadge({ method, razorpayId }) {
  const isCod = String(method || '').toUpperCase() === 'COD';
  const isPrepaid = Boolean(razorpayId) || (!isCod && Boolean(method));

  if (isCod) {
    return <span className="orders-payment-badge cod">Cash on Delivery (COD)</span>;
  }
  if (isPrepaid) {
    return (
      <span className="orders-payment-badge prepaid" title={razorpayId ? `Payment ID: ${razorpayId}` : 'Prepaid'}>
        Prepaid ({method || 'Online'})
      </span>
    );
  }
  return <span className="orders-payment-badge">{method || 'Online'}</span>;
}

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [products, setProducts] = useState([]);
  const [authUnits, setAuthUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [errorNotice, setErrorNotice] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [downloading, setDownloading] = useState('');
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [copiedField, setCopiedField] = useState('');

  useEffect(() => {
    if (id) {
      loadOrderData();
    }
  }, [id]);

  const loadOrderData = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      const [productsRes, authUnitsRes] = await Promise.all([
        supabase.from('products').select('id, name, summary'),
        supabase
          .from('product_auth_units')
          .select('*')
          .eq('order_id', id)
          .order('serial_number', { ascending: true }),
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (authUnitsRes.data) setAuthUnits(authUnitsRes.data);
    } catch (err) {
      console.error('Error loading order detail:', err.message);
      setError(err.message || 'Order not found');
    } finally {
      setLoading(false);
    }
  };

  const printDocument = async (documentNode) => {
    const blob = await pdf(documentNode).toBlob();
    const url = URL.createObjectURL(blob);

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 60000);
    };
  };

  const downloadDocument = async (documentNode, fileName) => {
    const blob = await pdf(documentNode).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintSlip = async () => {
    if (!order) return;
    try {
      await printDocument(<PackingSlipPDF order={order} />);
    } catch (err) {
      console.error('Error generating packing slip:', err);
      setErrorNotice('Failed to generate packing slip.');
    }
  };

  const handleDownloadCertificates = async () => {
    if (!order) return;
    setDownloading('cert');
    try {
      if (!authUnits.length) {
        setErrorNotice('No assigned authenticity certificates found for this order.');
        return;
      }
      const brandPrefix = adminConfig?.storeName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Order';
      await downloadDocument(
        <AuthenticityCertificatePDF order={order} units={authUnits} products={products} />,
        `${brandPrefix}_Authenticity_Certificates_${order.id.slice(0, 8).toUpperCase()}.pdf`,
      );
    } catch (err) {
      console.error('Error downloading certificates:', err.message);
      setErrorNotice(`Failed to download certificates: ${err.message}`);
    } finally {
      setDownloading('');
    }
  };

  const handleDownloadQrSheet = async () => {
    if (!order) return;
    setDownloading('qr');
    try {
      if (!authUnits.length) {
        setErrorNotice('No assigned QR labels found for this order.');
        return;
      }
      const brandPrefix = adminConfig?.storeName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Order';
      await downloadDocument(
        <AuthenticityQrSheetPDF order={order} units={authUnits} />,
        `${brandPrefix}_QR_Sheet_${order.id.slice(0, 8).toUpperCase()}.pdf`,
      );
    } catch (err) {
      console.error('Error downloading QR sheet:', err.message);
      setErrorNotice(`Failed to download QR sheet: ${err.message}`);
    } finally {
      setDownloading('');
    }
  };

  const handleStatusChangeClick = (newStatus) => {
    if (!order || order.status === newStatus) return;

    if (newStatus === 'cancelled') {
      setCancelConfirmOpen(true);
      return;
    }

    executeStatusChange(newStatus);
  };

  const executeStatusChange = async (newStatus) => {
    if (!order) return;
    setUpdatingStatus(true);
    setErrorNotice('');
    setSuccessNotice('');

    try {
      const oldStatus = order.status;

      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (updateError) throw updateError;

      // Preserve inventory restock logic
      if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
        for (const item of order.items || []) {
          const { error: stockErr } = await supabase.rpc('increment_stock', {
            product_id: item.id,
            quantity: item.quantity,
          });
          if (stockErr) console.error('Failed to restock:', stockErr);
        }
      } else if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
        for (const item of order.items || []) {
          const { error: stockErr } = await supabase.rpc('decrement_stock', {
            product_id: item.id,
            quantity: item.quantity,
          });
          if (stockErr) console.error('Failed to un-restock:', stockErr);
        }
      }

      setOrder((current) => ({ ...current, status: newStatus }));
      setSuccessNotice(`Order status successfully updated to ${formatStatusText(newStatus)}.`);
      setTimeout(() => setSuccessNotice(''), 4000);
    } catch (err) {
      console.error('Error updating status:', err.message);
      setErrorNotice(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
      setCancelConfirmOpen(false);
    }
  };

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2500);
  };

  const items = useMemo(() => {
    if (!order?.items) return [];
    if (Array.isArray(order.items)) return order.items;
    return [];
  }, [order?.items]);

  const itemsTotal = useMemo(() => {
    return items.reduce((acc, item) => {
      const lineTotal = Number(item.lineTotal || (Number(item.price || 0) * Number(item.quantity || 1)));
      return acc + lineTotal;
    }, 0);
  }, [items]);

  if (loading) {
    return (
      <div className="order-detail-page" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--admin-text-muted)' }}>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-detail-page">
        <AdminPageHeader
          eyebrow="Commerce · Operations"
          title="Order Not Found"
          actions={
            <button className="btn-secondary" onClick={() => navigate('/orders')}>
              <ArrowLeft size={16} />
              <span>Back to Orders</span>
            </button>
          }
        />
        <EmptyState
          icon={<Package size={36} />}
          title="Order Not Found"
          description={`Unable to locate order with ID "${id}". It may have been deleted or the link is invalid.`}
          action={
            <button className="btn-secondary" onClick={() => navigate('/orders')}>
              Return to Orders List
            </button>
          }
        />
      </div>
    );
  }

  const shortId = order.id.slice(0, 8).toUpperCase();
  const shipping = order.shipping_address || {};

  return (
    <div className="order-detail-page">
      <AdminPageHeader
        eyebrow="Commerce · Operations"
        title={`Order #${shortId}`}
        description={`Created on ${formatOrderDate(order.created_at)} at ${formatOrderTime(order.created_at)}`}
        actions={
          <>
            <button className="btn-secondary" onClick={() => navigate('/orders')}>
              <ArrowLeft size={16} />
              <span>Back to Orders</span>
            </button>
            <button className="btn-primary" onClick={handlePrintSlip}>
              <Printer size={16} />
              <span>Print Packing Slip</span>
            </button>
          </>
        }
      />

      {errorNotice && (
        <div className="orders-error-banner" role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <WarningCircle size={20} />
            <span>{errorNotice}</span>
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '4px 8px', border: 'none', background: 'transparent' }}
            onClick={() => setErrorNotice('')}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {successNotice && (
        <div className="product-success-banner" role="status">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={20} />
            <span>{successNotice}</span>
          </div>
        </div>
      )}

      {/* Top Operational Status Strip */}
      <div className="order-detail-top-strip">
        <div className="order-detail-top-meta">
          <div className="order-detail-top-item">
            <small>Fulfillment Status</small>
            <StatusBadge status={getStatusTone(order.status)}>
              {formatStatusText(order.status)}
            </StatusBadge>
          </div>
          <div className="order-detail-top-item">
            <small>Payment Method</small>
            <PaymentMethodBadge method={order.payment_method} razorpayId={order.razorpay_payment_id} />
          </div>
          <div className="order-detail-top-item">
            <small>Total Amount</small>
            <strong style={{ fontSize: '1rem', color: 'var(--admin-text)' }}>
              INR {Number(order.total_amount || order.total || 0).toLocaleString('en-IN')}
            </strong>
          </div>
          <div className="order-detail-top-item">
            <small>Items Count</small>
            <span>{items.length} {items.length === 1 ? 'item' : 'items'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handlePrintSlip}
            style={{ padding: '8px 12px', fontSize: '0.84rem' }}
          >
            <Printer size={16} />
            <span>Slip</span>
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleDownloadCertificates}
            disabled={downloading === 'cert'}
            style={{ padding: '8px 12px', fontSize: '0.84rem' }}
          >
            <DownloadSimple size={16} />
            <span>{downloading === 'cert' ? 'Certificates...' : 'Certificates'}</span>
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleDownloadQrSheet}
            disabled={downloading === 'qr'}
            style={{ padding: '8px 12px', fontSize: '0.84rem' }}
          >
            <DownloadSimple size={16} />
            <span>{downloading === 'qr' ? 'QR Sheet...' : 'QR Sheet'}</span>
          </button>
        </div>
      </div>

      <div className="order-detail-layout">
        {/* Main Column (Left) */}
        <div className="order-detail-main">
          {/* Card 1: Order Items & Financials */}
          <div className="order-detail-card">
            <div className="order-detail-card-header">
              <h3>Purchased Items ({items.length})</h3>
              <small>Order Line Items</small>
            </div>

            {items.length === 0 ? (
              <p style={{ color: 'var(--admin-text-muted)', margin: 0, padding: '12px 0' }}>
                No line items recorded for this order.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="order-detail-items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style={{ textAlign: 'right' }}>Unit Price</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const unitPrice = Number(item.price || 0);
                      const qty = Number(item.quantity || 1);
                      const lineTotal = Number(item.lineTotal || (unitPrice * qty));

                      return (
                        <tr key={item.id || idx}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--admin-text)' }}>
                              {item.name || item.title || 'Product Item'}
                            </div>
                            {item.id && (
                              <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-subtle)', fontFamily: 'monospace' }}>
                                ID: {String(item.id).slice(0, 8)}
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            INR {unitPrice.toLocaleString('en-IN')}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{qty}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            INR {lineTotal.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Financial Breakdown */}
            <div className="order-detail-totals">
              <div className="order-detail-total-row">
                <span>Items Subtotal</span>
                <span>INR {itemsTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="order-detail-total-row">
                <span>Shipping Method</span>
                <span>{shipping.shippingMethod || 'Standard Delivery'}</span>
              </div>
              <div className="order-detail-total-row is-grand-total">
                <span>Grand Total</span>
                <span>INR {Number(order.total_amount || order.total || itemsTotal).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Document Generation & Provenance Units */}
          <div className="order-detail-card">
            <div className="order-detail-card-header">
              <h3>Fulfillment Documents & Provenance</h3>
              <small>Export Tools</small>
            </div>

            <div className="order-detail-actions-grid">
              <div className="order-detail-action-card">
                <h4>Packing Slip</h4>
                <p>Standard printable dispatch slip containing recipient address and order contents.</p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handlePrintSlip}
                  style={{ marginTop: 'auto' }}
                >
                  <Printer size={16} />
                  <span>Print Slip</span>
                </button>
              </div>

              <div className="order-detail-action-card">
                <h4>Authenticity Certificates</h4>
                <p>Downloadable verification certificates for individual serial units assigned to this order.</p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleDownloadCertificates}
                  disabled={downloading === 'cert'}
                  style={{ marginTop: 'auto' }}
                >
                  <DownloadSimple size={16} />
                  <span>{downloading === 'cert' ? 'Downloading...' : 'Download Certs'}</span>
                </button>
              </div>

              <div className="order-detail-action-card">
                <h4>QR Label Sheet</h4>
                <p>Printable QR verification labels to affix to physical packaging or certificate cards.</p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleDownloadQrSheet}
                  disabled={downloading === 'qr'}
                  style={{ marginTop: 'auto' }}
                >
                  <QrCode size={16} />
                  <span>{downloading === 'qr' ? 'Downloading...' : 'Download QR Sheet'}</span>
                </button>
              </div>
            </div>

            {/* Assigned Authenticity Units List */}
            {authUnits.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <p style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--admin-text)', marginBottom: '8px' }}>
                  Assigned Authenticity Units ({authUnits.length})
                </p>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {authUnits.map((unit) => (
                    <div
                      key={unit.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        border: '1px solid var(--admin-border)',
                        borderRadius: 'var(--admin-radius-sm)',
                        background: 'var(--admin-surface-hover)',
                        fontSize: '0.84rem',
                      }}
                    >
                      <div>
                        <strong>Unit #{unit.serial_number}</strong> ·{' '}
                        <span style={{ fontFamily: 'monospace' }}>{unit.public_unit_id}</span>
                      </div>
                      <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.78rem' }}>
                        Code: {unit.authenticity_code}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Supporting Column (Right) */}
        <div className="order-detail-side">
          {/* Card 3: Fulfillment Status Transition */}
          <div className="order-detail-card">
            <div className="order-detail-card-header">
              <h3>Order Status</h3>
              <StatusBadge status={getStatusTone(order.status)}>
                {formatStatusText(order.status)}
              </StatusBadge>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--admin-text-muted)', margin: 0 }}>
              Update the current order fulfillment lifecycle state:
            </p>

            <div className="order-detail-status-grid">
              {EDITABLE_STATUSES.map((status) => {
                const isActive = (order.status || '').toLowerCase() === status;
                const tone = getStatusTone(status);

                return (
                  <button
                    key={status}
                    type="button"
                    className={`order-detail-status-btn ${isActive ? 'is-active' : ''}`}
                    onClick={() => handleStatusChangeClick(status)}
                    disabled={updatingStatus}
                  >
                    <span
                      className="admin-status-badge-dot"
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '999px',
                        flexShrink: 0,
                        background:
                          tone === 'success'
                            ? 'var(--admin-success)'
                            : tone === 'warning'
                            ? 'var(--admin-warning)'
                            : tone === 'info'
                            ? 'var(--admin-info)'
                            : tone === 'danger'
                            ? 'var(--admin-danger)'
                            : 'var(--admin-text-subtle)',
                      }}
                    />
                    <span>{formatStatusText(status)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 4: Customer Details */}
          <div className="order-detail-card">
            <div className="order-detail-card-header">
              <h3>Customer</h3>
              <User size={18} color="var(--admin-text-subtle)" />
            </div>

            <div className="order-detail-info-list">
              <div className="order-detail-info-item">
                <span className="order-detail-info-label">Customer Name</span>
                <span className="order-detail-info-val">
                  {order.customer_name || shipping.name || 'Guest Customer'}
                </span>
              </div>

              <div className="order-detail-info-item">
                <span className="order-detail-info-label">Email Address</span>
                <span className="order-detail-info-val">
                  {order.customer_email ? (
                    <a
                      href={`mailto:${order.customer_email}`}
                      style={{ color: 'var(--admin-primary)', textDecoration: 'none' }}
                    >
                      {order.customer_email}
                    </a>
                  ) : (
                    '—'
                  )}
                </span>
              </div>

              <div className="order-detail-info-item">
                <span className="order-detail-info-label">Phone</span>
                <span className="order-detail-info-val">
                  {order.customer_phone || shipping.phone ? (
                    <a
                      href={`tel:${order.customer_phone || shipping.phone}`}
                      style={{ color: 'var(--admin-text)', textDecoration: 'none' }}
                    >
                      {order.customer_phone || shipping.phone}
                    </a>
                  ) : (
                    '—'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Card 5: Shipping & Delivery Address */}
          <div className="order-detail-card">
            <div className="order-detail-card-header">
              <h3>Shipping Destination</h3>
              <MapPin size={18} color="var(--admin-text-subtle)" />
            </div>

            <div className="order-detail-info-list">
              <div className="order-detail-info-item">
                <span className="order-detail-info-label">Street Address</span>
                <span className="order-detail-info-val">{shipping.address || '—'}</span>
              </div>

              <div className="order-detail-info-item">
                <span className="order-detail-info-label">City & Pincode</span>
                <span className="order-detail-info-val">
                  {shipping.city || ''}
                  {shipping.city && shipping.pincode ? ` — ${shipping.pincode}` : shipping.pincode || '—'}
                </span>
              </div>

              <div className="order-detail-info-item">
                <span className="order-detail-info-label">Shipping Method</span>
                <span className="order-detail-info-val">
                  {shipping.shippingMethod || 'Standard Delivery'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 6: Payment & Identifiers */}
          <div className="order-detail-card">
            <div className="order-detail-card-header">
              <h3>Payment & Metadata</h3>
              <ShieldCheck size={18} color="var(--admin-text-subtle)" />
            </div>

            <div className="order-detail-info-list">
              <div className="order-detail-info-item">
                <span className="order-detail-info-label">Payment Method</span>
                <div style={{ marginTop: '2px' }}>
                  <PaymentMethodBadge method={order.payment_method} razorpayId={order.razorpay_payment_id} />
                </div>
              </div>

              {order.razorpay_payment_id && (
                <div className="order-detail-info-item">
                  <span className="order-detail-info-label">Razorpay Payment ID</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="order-detail-info-val is-mono">{order.razorpay_payment_id}</span>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '3px 6px', border: 'none', background: 'transparent' }}
                      onClick={() => copyToClipboard(order.razorpay_payment_id, 'razorpay')}
                      title="Copy payment ID"
                    >
                      <Copy size={14} />
                    </button>
                    {copiedField === 'razorpay' && (
                      <small style={{ color: 'var(--admin-success)' }}>Copied!</small>
                    )}
                  </div>
                </div>
              )}

              <div className="order-detail-info-item">
                <span className="order-detail-info-label">Internal Order UUID</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="order-detail-info-val is-mono" style={{ fontSize: '0.8rem' }}>
                    {order.id}
                  </span>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '3px 6px', border: 'none', background: 'transparent' }}
                    onClick={() => copyToClipboard(order.id, 'uuid')}
                    title="Copy full UUID"
                  >
                    <Copy size={14} />
                  </button>
                  {copiedField === 'uuid' && (
                    <small style={{ color: 'var(--admin-success)' }}>Copied!</small>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Destructive Cancellation */}
      <ConfirmDialog
        isOpen={cancelConfirmOpen}
        title={`Cancel Order #${shortId}?`}
        message="Are you sure you want to cancel this order? The item quantities will automatically be returned to inventory stock."
        confirmText="Cancel Order"
        cancelText="Keep Order"
        danger={true}
        loading={updatingStatus}
        onCancel={() => setCancelConfirmOpen(false)}
        onConfirm={() => executeStatusChange('cancelled')}
      />
    </div>
  );
};

export default OrderDetail;
