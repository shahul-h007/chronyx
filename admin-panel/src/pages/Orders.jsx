import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowSquareOut,
  CaretDown,
  CheckCircle,
  Clock,
  DownloadSimple,
  Lightning,
  MagnifyingGlass,
  Package,
  Printer,
  StackSimple,
  Truck,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import { pdf } from '@react-pdf/renderer';
import { supabase } from '../lib/supabase';
import { adminConfig, formatCurrency } from '../config/adminConfig';
import AdminPageHeader from '../components/common/AdminPageHeader';
import StatCard from '../components/common/StatCard';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import PackingSlipPDF from '../components/pdf/PackingSlipPDF';
import PackingSlipBatchPDF from '../components/pdf/PackingSlipBatchPDF';
import AuthenticityCertificatePDF from '../components/pdf/AuthenticityCertificatePDF';
import AuthenticityQrSheetPDF from '../components/pdf/AuthenticityQrSheetPDF';

const ORDER_STATUSES = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];
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
    return <span className="orders-payment-badge cod">COD</span>;
  }
  if (isPrepaid) {
    return (
      <span className="orders-payment-badge prepaid" title={razorpayId ? `Payment ID: ${razorpayId}` : 'Prepaid Online'}>
        {method || 'Online'}
      </span>
    );
  }
  return <span className="orders-payment-badge">{method || '—'}</span>;
}

function StatusMenu({ value, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const tone = getStatusTone(value);

  return (
    <div ref={menuRef} className={`orders-status-menu ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className={`orders-status-trigger tone-${tone}`}
        onClick={() => !disabled && setOpen((current) => !current)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Click to update order status"
      >
        <span className="admin-status-badge-dot" />
        <span>{formatStatusText(value)}</span>
        <CaretDown size={12} className="orders-status-caret" />
      </button>

      {open ? (
        <div className="orders-status-popover" role="listbox">
          {EDITABLE_STATUSES.map((status) => {
            const itemTone = getStatusTone(status);
            const isActive = String(status).toLowerCase() === String(value).toLowerCase();
            return (
              <button
                key={status}
                type="button"
                className={isActive ? 'is-active' : ''}
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onChange(status);
                  setOpen(false);
                }}
              >
                <span
                  className="admin-status-badge-dot"
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '999px',
                    flexShrink: 0,
                    background:
                      itemTone === 'success'
                        ? 'var(--admin-success)'
                        : itemTone === 'warning'
                        ? 'var(--admin-warning)'
                        : itemTone === 'info'
                        ? 'var(--admin-info)'
                        : itemTone === 'danger'
                        ? 'var(--admin-danger)'
                        : 'var(--admin-text-subtle)',
                  }}
                />
                <span>{formatStatusText(status)}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [downloadingAuthFor, setDownloadingAuthFor] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    supabase.from('products').select('id, name, summary').then(({ data, error }) => {
      if (error) {
        console.error('Error fetching products for authenticity downloads:', error.message);
        return;
      }
      setProducts(data || []);
    });
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error.message);
      setErrorMessage(`Failed to load orders: ${error.message}`);
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

  const getOrderAuthUnits = async (orderId) => {
    const { data, error } = await supabase
      .from('product_auth_units')
      .select('*')
      .eq('order_id', orderId)
      .order('serial_number', { ascending: true });

    if (error) throw error;
    return data || [];
  };

  const handlePrintSlip = async (order) => {
    try {
      await printDocument(<PackingSlipPDF order={order} />);
    } catch (error) {
      console.error('Error generating print slip:', error);
      setErrorMessage('Failed to generate packing slip.');
    }
  };

  const handlePrintBatch = async (batchOrders, label) => {
    if (!batchOrders.length) return;

    try {
      await printDocument(<PackingSlipBatchPDF orders={batchOrders} />);
    } catch (error) {
      console.error(`Error generating ${label} slips:`, error);
      setErrorMessage(`Failed to generate ${label} slips.`);
    }
  };

  const handleDownloadCertificates = async (order) => {
    setDownloadingAuthFor(`${order.id}:cert`);

    try {
      const units = await getOrderAuthUnits(order.id);
      if (!units.length) {
        setErrorMessage(`No assigned authenticity certificates found for Order #${order.id.slice(0, 8)}.`);
        return;
      }

      const brandPrefix = adminConfig?.storeName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Order';
      await downloadDocument(
        <AuthenticityCertificatePDF order={order} units={units} products={products} />,
        `${brandPrefix}_Authenticity_Certificates_${order.id.slice(0, 8).toUpperCase()}.pdf`,
      );
    } catch (error) {
      console.error('Error downloading authenticity certificates:', error.message);
      setErrorMessage(`Failed to download certificates: ${error.message}`);
    } finally {
      setDownloadingAuthFor('');
    }
  };

  const handleDownloadQrSheet = async (order) => {
    setDownloadingAuthFor(`${order.id}:qr`);

    try {
      const units = await getOrderAuthUnits(order.id);
      if (!units.length) {
        setErrorMessage(`No assigned QR labels found for Order #${order.id.slice(0, 8)}.`);
        return;
      }

      const brandPrefix = adminConfig?.storeName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Order';
      await downloadDocument(
        <AuthenticityQrSheetPDF order={order} units={units} />,
        `${brandPrefix}_QR_Sheet_${order.id.slice(0, 8).toUpperCase()}.pdf`,
      );
    } catch (error) {
      console.error('Error downloading authenticity QR sheet:', error.message);
      setErrorMessage(`Failed to download QR sheet: ${error.message}`);
    } finally {
      setDownloadingAuthFor('');
    }
  };

  const handleStatusChangeRequest = (orderId, newStatus) => {
    const order = orders.find((item) => item.id === orderId);
    if (!order) return;

    // Destructive confirmation when cancelling an active order
    if (newStatus === 'cancelled' && order.status !== 'cancelled') {
      setCancelModalOrder({ orderId, order });
      return;
    }

    executeStatusChange(orderId, newStatus);
  };

  const executeStatusChange = async (orderId, newStatus) => {
    setUpdatingStatusId(orderId);
    setErrorMessage('');
    try {
      const order = orders.find((item) => item.id === orderId);
      const oldStatus = order.status;

      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;

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

      setOrders((current) =>
        current.map((item) => (item.id === orderId ? { ...item, status: newStatus } : item)),
      );
    } catch (error) {
      console.error('Error updating status:', error.message);
      setErrorMessage(`Failed to update status: ${error.message}`);
    } finally {
      setUpdatingStatusId('');
      setCancelModalOrder(null);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Customer', 'Email', 'Amount', 'Status', 'Payment Method', 'Date'];
    const csvContent = [
      headers.join(','),
      ...orders.map((order) =>
        [
          order.id,
          `"${order.customer_name || 'Guest'}"`,
          order.customer_email,
          order.total_amount || order.total || 0,
          order.status,
          order.payment_method || 'Online',
          order.created_at,
        ].join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const statusCounts = useMemo(() => {
    const counts = { all: orders.length };
    for (const s of ['pending', 'processing', 'shipped', 'delivered', 'cancelled']) {
      counts[s] = orders.filter((o) => (o.status || '').toLowerCase() === s).length;
    }
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (filter !== 'all') {
        if ((order.status || '').toLowerCase() !== filter) return false;
      }
      if (!q) return true;
      const id = (order.id || '').toLowerCase();
      const name = (order.customer_name || '').toLowerCase();
      const email = (order.customer_email || '').toLowerCase();
      const city = (order.shipping_address?.city || '').toLowerCase();
      const method = (order.payment_method || '').toLowerCase();
      return id.includes(q) || name.includes(q) || email.includes(q) || city.includes(q) || method.includes(q);
    });
  }, [orders, filter, search]);

  const stats = useMemo(() => {
    const total = orders.length;
    const processing = orders.filter((order) => order.status === 'processing').length;
    const shipped = orders.filter((order) => order.status === 'shipped').length;
    const delivered = orders.filter((order) => order.status === 'delivered').length;
    return { total, processing, shipped, delivered };
  }, [orders]);

  const latestOrder = orders[0] || null;
  const untouchedOrders = orders.filter((order) => order.status === 'processing');
  const latestFiveOrders = orders.slice(0, 5);

  return (
    <div className="orders-page">
      <AdminPageHeader
        eyebrow="Commerce · Operations"
        title="Orders"
        description="Fulfillment queue for daily order dispatch, status updates, invoice packing slips, and provenance certificates."
        actions={
          <button className="btn-secondary" onClick={handleExportCSV} disabled={orders.length === 0}>
            <DownloadSimple size={16} />
            <span>Export CSV</span>
          </button>
        }
      />

      {errorMessage && (
        <div className="orders-error-banner" role="alert">
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

      {/* Operational Order Stats */}
      <div className="orders-stat-grid">
        <StatCard
          label="Total Orders"
          value={stats.total}
          icon={<Package size={20} />}
          tone="neutral"
          description="All recorded customer orders"
        />
        <StatCard
          label="Processing"
          value={stats.processing}
          icon={<Clock size={20} />}
          tone="warning"
          description="Requires fulfillment & packing"
        />
        <StatCard
          label="Shipped"
          value={stats.shipped}
          icon={<Truck size={20} />}
          tone="info"
          description="In transit to customer"
        />
        <StatCard
          label="Delivered"
          value={stats.delivered}
          icon={<CheckCircle size={20} />}
          tone="success"
          description="Successfully completed"
        />
      </div>

      {/* Quick Batch Fulfillment Strip */}
      <div className="orders-quick-strip">
        <div className="orders-quick-copy">
          <p className="settings-panel-eyebrow">Batch Slip Operations</p>
          <h3>One-click packing slip generation</h3>
          <p>Instantly generate print slips for the latest order or unprocessed batches without opening each row.</p>
        </div>
        <div className="orders-quick-actions">
          <button
            type="button"
            className="btn-secondary orders-quick-btn"
            onClick={() => latestOrder && handlePrintSlip(latestOrder)}
            disabled={!latestOrder}
            title={latestOrder ? `Print slip for Order #${latestOrder.id.slice(0, 8)}` : 'No orders available'}
          >
            <Printer size={16} />
            <span>Latest Slip</span>
          </button>
          <button
            type="button"
            className="btn-secondary orders-quick-btn"
            onClick={() => handlePrintBatch(untouchedOrders, 'processing')}
            disabled={!untouchedOrders.length}
            title={untouchedOrders.length ? `Batch print ${untouchedOrders.length} processing slips` : 'No processing orders'}
          >
            <Lightning size={16} />
            <span>Print Processing ({untouchedOrders.length})</span>
          </button>
          <button
            type="button"
            className="btn-secondary orders-quick-btn"
            onClick={() => handlePrintBatch(latestFiveOrders, 'latest')}
            disabled={!latestFiveOrders.length}
            title="Batch print packing slips for the last 5 orders"
          >
            <StackSimple size={16} />
            <span>Print Latest 5</span>
          </button>
        </div>
      </div>

      {/* Orders List & Controls Card */}
      <div className="orders-list-card">
        <div className="orders-toolbar">
          <div className="orders-filter-row">
            {ORDER_STATUSES.map((status) => {
              const count = statusCounts[status] ?? 0;
              const isActive = filter === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilter(status)}
                  className={`orders-filter-chip ${isActive ? 'is-active' : ''}`}
                >
                  <span>{formatStatusText(status)}</span>
                  <span className="orders-filter-count">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="orders-search-wrap">
            <MagnifyingGlass size={16} className="orders-search-icon" />
            <input
              type="text"
              className="orders-search-input"
              placeholder="Search by ID, name, email, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="orders-search-clear"
                onClick={() => setSearch('')}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
            <p>Loading orders queue...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          orders.length === 0 ? (
            <EmptyState
              icon={<Package size={36} />}
              title="No orders yet"
              description="Orders placed on your storefront will appear in this operational management queue."
            />
          ) : search ? (
            <EmptyState
              icon={<MagnifyingGlass size={36} />}
              title="No matching orders"
              description={`No orders match your query "${search}".`}
              action={
                <button type="button" className="btn-secondary" onClick={() => setSearch('')}>
                  Clear Search
                </button>
              }
            />
          ) : (
            <EmptyState
              icon={<Package size={36} />}
              title={`No ${formatStatusText(filter)} orders`}
              description="There are currently no orders in this status category."
              action={
                <button type="button" className="btn-secondary" onClick={() => setFilter('all')}>
                  View All Orders
                </button>
              }
            />
          )
        ) : (
          <>
            {/* Desktop Operational Table */}
            <div className="orders-table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order & Date</th>
                    <th>Customer</th>
                    <th>Items & Destination</th>
                    <th>Payment</th>
                    <th>Total Amount</th>
                    <th>Fulfillment Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const itemCount = (order.items || []).length;
                    const city = order.shipping_address?.city;
                    const isUpdating = updatingStatusId === order.id;

                    return (
                      <tr key={order.id}>
                        <td className="orders-id-cell">
                          <Link to={`/orders/${order.id}`} className="orders-id-link">
                            <span className="orders-id-code">#{order.id.slice(0, 8).toUpperCase()}</span>
                          </Link>
                          <div className="orders-date-text">
                            {formatOrderDate(order.created_at)} · {formatOrderTime(order.created_at)}
                          </div>
                        </td>

                        <td className="orders-customer-cell">
                          <div className="orders-customer-name">{order.customer_name || 'Guest Customer'}</div>
                          <div className="orders-customer-email">{order.customer_email || '—'}</div>
                        </td>

                        <td className="orders-items-cell">
                          <div>{itemCount} {itemCount === 1 ? 'item' : 'items'}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-subtle)' }}>
                            {city ? city : 'Standard Delivery'}
                          </div>
                        </td>

                        <td>
                          <PaymentMethodBadge
                            method={order.payment_method}
                            razorpayId={order.razorpay_payment_id}
                          />
                        </td>

                        <td className="orders-total-cell">
                          {formatCurrency(order.total_amount || order.total || 0)}
                        </td>

                        <td>
                          <StatusMenu
                            value={order.status}
                            disabled={isUpdating}
                            onChange={(nextStatus) => handleStatusChangeRequest(order.id, nextStatus)}
                          />
                        </td>

                        <td className="orders-actions-cell" style={{ textAlign: 'right' }}>
                          <div className="orders-actions-cluster" style={{ justifyContent: 'flex-end' }}>
                            <Link
                              to={`/orders/${order.id}`}
                              className="btn-secondary orders-action-btn"
                              title="View Order Details"
                            >
                              <ArrowSquareOut size={15} />
                              <span>View</span>
                            </Link>
                            <button
                              type="button"
                              className="btn-secondary orders-action-btn"
                              onClick={() => handlePrintSlip(order)}
                              title="Print Packing Slip"
                            >
                              <Printer size={15} />
                              <span>Slip</span>
                            </button>
                            <button
                              type="button"
                              className="btn-secondary orders-action-btn"
                              onClick={() => handleDownloadCertificates(order)}
                              disabled={downloadingAuthFor === `${order.id}:cert`}
                              title="Download Authenticity Certificates"
                            >
                              <DownloadSimple size={15} />
                              <span>{downloadingAuthFor === `${order.id}:cert` ? 'Certs...' : 'Certs'}</span>
                            </button>
                            <button
                              type="button"
                              className="btn-secondary orders-action-btn"
                              onClick={() => handleDownloadQrSheet(order)}
                              disabled={downloadingAuthFor === `${order.id}:qr`}
                              title="Download QR Label Sheet"
                            >
                              <DownloadSimple size={15} />
                              <span>{downloadingAuthFor === `${order.id}:qr` ? 'QR...' : 'QR'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards */}
            <div className="orders-mobile-list">
              {filteredOrders.map((order) => {
                const itemCount = (order.items || []).length;
                const isUpdating = updatingStatusId === order.id;

                return (
                  <article key={order.id} className="orders-mobile-card">
                    <div className="orders-mobile-top">
                      <div>
                        <Link to={`/orders/${order.id}`} className="orders-id-link">
                          <span className="orders-id-code">#{order.id.slice(0, 8).toUpperCase()}</span>
                        </Link>
                        <div className="orders-date-text">{formatOrderDate(order.created_at)}</div>
                      </div>
                      <StatusMenu
                        value={order.status}
                        disabled={isUpdating}
                        onChange={(nextStatus) => handleStatusChangeRequest(order.id, nextStatus)}
                      />
                    </div>

                    <div className="orders-mobile-meta">
                      <strong>{order.customer_name || 'Guest Customer'}</strong>
                      <span className="orders-customer-email">{order.customer_email}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{ color: 'var(--admin-text-muted)' }}>
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                          {order.shipping_address?.city ? ` · ${order.shipping_address.city}` : ''}
                        </span>
                        <PaymentMethodBadge
                          method={order.payment_method}
                          razorpayId={order.razorpay_payment_id}
                        />
                      </div>
                    </div>

                    <div className="orders-mobile-bottom">
                      <div>
                        <small style={{ display: 'block', fontSize: '0.72rem', color: 'var(--admin-text-subtle)', textTransform: 'uppercase' }}>
                          Total
                        </small>
                        <strong style={{ fontSize: '1rem', color: 'var(--admin-text)' }}>
                          {formatCurrency(order.total_amount || order.total || 0)}
                        </strong>
                      </div>

                      <div className="orders-actions-cluster">
                        <Link
                          to={`/orders/${order.id}`}
                          className="btn-secondary orders-action-btn"
                          title="View Order Details"
                        >
                          <ArrowSquareOut size={15} />
                          <span>View</span>
                        </Link>
                        <button
                          type="button"
                          className="btn-secondary orders-action-btn"
                          onClick={() => handlePrintSlip(order)}
                          title="Print Packing Slip"
                        >
                          <Printer size={15} />
                          <span>Slip</span>
                        </button>
                        <button
                          type="button"
                          className="btn-secondary orders-action-btn"
                          onClick={() => handleDownloadCertificates(order)}
                          disabled={downloadingAuthFor === `${order.id}:cert`}
                          title="Download Certificates"
                        >
                          <DownloadSimple size={15} />
                          <span>Certs</span>
                        </button>
                        <button
                          type="button"
                          className="btn-secondary orders-action-btn"
                          onClick={() => handleDownloadQrSheet(order)}
                          disabled={downloadingAuthFor === `${order.id}:qr`}
                          title="Download QR Sheet"
                        >
                          <DownloadSimple size={15} />
                          <span>QR</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Confirmation Dialog for Destructive Cancellation */}
      <ConfirmDialog
        isOpen={Boolean(cancelModalOrder)}
        title={`Cancel Order #${cancelModalOrder?.order?.id?.slice(0, 8)?.toUpperCase()}?`}
        message="Are you sure you want to cancel this order? The items in this order will automatically be returned to product inventory."
        confirmText="Cancel Order"
        cancelText="Keep Order"
        danger={true}
        loading={Boolean(updatingStatusId)}
        onCancel={() => setCancelModalOrder(null)}
        onConfirm={() => cancelModalOrder && executeStatusChange(cancelModalOrder.orderId, 'cancelled')}
      />
    </div>
  );
};

export default Orders;
