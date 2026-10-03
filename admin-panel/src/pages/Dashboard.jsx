import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowClockwise,
  ArrowRight,
  ChartLineUp,
  ChatCircleDots,
  ClockCounterClockwise,
  CurrencyInr,
  Package,
  ShoppingCart,
  WarningCircle,
} from '@phosphor-icons/react';
import { supabase } from '../lib/supabase';
import { AdminPageHeader, StatCard, StatusBadge, EmptyState } from '../components/common';
import { formatCurrency } from '../config/adminConfig';

const monthFormatter = new Intl.DateTimeFormat('en-IN', { month: 'short' });
const dateFormatter = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });

function formatDate(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return Number.isNaN(d.getTime()) ? '—' : dateFormatter.format(d);
}

function getOrderStatusTone(status) {
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

function formatStatusLabel(status) {
  if (!status) return 'Processing';
  return String(status).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function LineChart({ data }) {
  if (!data || !data.length || data.every((d) => d.value === 0)) {
    return (
      <EmptyState
        icon={ChartLineUp}
        title="No revenue data yet"
        description="Monthly revenue trends will plot automatically as confirmed orders are received."
      />
    );
  }

  const width = 520;
  const height = 220;
  const padding = 18;
  const max = Math.max(...data.map((item) => item.value), 1);
  const stepX = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;

  const points = data
    .map((item, index) => {
      const x = padding + stepX * index;
      const y = height - padding - (item.value / max) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <div className="dashboard-chart-shell">
      <svg viewBox={`0 0 ${width} ${height}`} className="dashboard-line-chart" preserveAspectRatio="none">
        <defs>
          <linearGradient id="dashboardArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(15, 23, 42, 0.08)" />
            <stop offset="100%" stopColor="rgba(15, 23, 42, 0.0)" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#dashboardArea)" />
        <polyline
          points={points}
          fill="none"
          stroke="var(--admin-primary, #0f172a)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((item, index) => {
          const x = padding + stepX * index;
          const y = height - padding - (item.value / max) * (height - padding * 2);
          return (
            <circle
              key={item.label}
              cx={x}
              cy={y}
              r="4"
              fill="#ffffff"
              stroke="var(--admin-primary, #0f172a)"
              strokeWidth="2"
            />
          );
        })}
      </svg>
      <div className="dashboard-chart-labels">
        {data.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong>{formatCurrency(item.value)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarList({ items, total }) {
  if (!items || !items.length) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="No status data yet"
        description="Order fulfillment distribution will display here once orders are placed."
      />
    );
  }

  return (
    <div className="dashboard-bar-list">
      {items.map((item) => {
        const percent = total ? Math.round((item.value / total) * 100) : 0;
        return (
          <div key={item.label} className="dashboard-bar-row">
            <div className="dashboard-bar-copy">
              <span className="dashboard-bar-label">
                <StatusBadge status={getOrderStatusTone(item.label)}>{item.label}</StatusBadge>
              </span>
              <strong>
                {item.value} <span className="dashboard-bar-percent">({percent}%)</span>
              </strong>
            </div>
            <div className="dashboard-bar-track">
              <div
                className="dashboard-bar-fill"
                style={{ width: `${Math.max(percent, item.value ? 6 : 0)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function safeNumber(...values) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersResult, productsResult, waitlistResult, subscribersResult, contactsResult] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('waitlist').select('*').order('created_at', { ascending: false }),
        supabase.from('subscribers').select('*').order('created_at', { ascending: false }),
        supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
      ]);

      if (!ordersResult.error) setOrders(ordersResult.data || []);
      if (!productsResult.error) setProducts(productsResult.data || []);
      if (!waitlistResult.error) setWaitlist(waitlistResult.data || []);
      if (!subscribersResult.error) setSubscribers(subscribersResult.data || []);
      if (!contactsResult.error) setContacts(contactsResult.data || []);

      if (ordersResult.error && productsResult.error) {
        setError('Failed to connect to the store database. Please check your network and try again.');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Unable to load dashboard data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const analytics = useMemo(() => {
    const activeOrders = orders.filter((order) => order.status !== 'cancelled');
    const revenue = activeOrders.reduce((sum, order) => sum + safeNumber(order.total_amount, order.total), 0);
    const averageOrderValue = activeOrders.length ? revenue / activeOrders.length : 0;

    const statusMap = activeOrders.reduce((acc, order) => {
      const key = order.status || 'processing';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const statusData = Object.entries(statusMap).map(([label, value]) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      value,
    }));

    const monthlyRevenueMap = new Map();
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      monthlyRevenueMap.set(key, {
        label: monthFormatter.format(date),
        value: 0,
      });
    }

    activeOrders.forEach((order) => {
      const createdAt = order.created_at ? new Date(order.created_at) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) return;
      const key = `${createdAt.getFullYear()}-${createdAt.getMonth()}`;
      if (!monthlyRevenueMap.has(key)) return;
      monthlyRevenueMap.get(key).value += safeNumber(order.total_amount, order.total);
    });

    const recentOrders = orders.slice(0, 6);

    const lowStockProducts = products
      .map((product) => ({
        id: product.id,
        name: product.name,
        stock: safeNumber(product.stock_quantity, product.stock),
        category: product.category || 'Uncategorised',
      }))
      .filter((product) => product.stock <= 5)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 6);

    const unreadContacts = contacts.filter((message) => !message.is_read).length;
    const newsletterAudience = subscribers.length;
    const waitlistAudience = waitlist.length;
    const publishedProducts = products.filter((product) => product.is_live ?? product.is_visible ?? true).length;

    return {
      revenue,
      averageOrderValue,
      orders: activeOrders.length,
      monthlyRevenue: Array.from(monthlyRevenueMap.values()),
      statusData,
      lowStockProducts,
      unreadContacts,
      newsletterAudience,
      waitlistAudience,
      publishedProducts,
      recentOrders,
    };
  }, [orders, products, waitlist, subscribers, contacts]);

  if (loading && orders.length === 0 && products.length === 0) {
    return (
      <div className="dashboard-page">
        <AdminPageHeader
          eyebrow="Overview"
          title="Dashboard"
          description="Live performance, order health, inventory pressure, and customer signals."
        />
        <div className="dashboard-loading-state">
          <div className="dashboard-loading-spinner">
            <ArrowClockwise size={28} className="spin-icon" />
          </div>
          <p>Loading dashboard metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <AdminPageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Live performance, order health, inventory pressure, and customer signals."
        actions={
          <button
            type="button"
            onClick={fetchDashboardData}
            className="btn-secondary"
            title="Refresh store data"
            disabled={loading}
          >
            <ArrowClockwise size={16} className={loading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
        }
      />

      {error && (
        <div className="dashboard-error-banner" role="alert">
          <div className="dashboard-error-content">
            <WarningCircle size={20} />
            <span>{error}</span>
          </div>
          <button type="button" onClick={fetchDashboardData} className="btn-secondary btn-sm">
            Retry
          </button>
        </div>
      )}

      {/* Primary KPI Row */}
      <section className="dashboard-stat-grid" aria-label="Key Performance Indicators">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(analytics.revenue)}
          description={`${analytics.orders} active order(s) tracked`}
          icon={CurrencyInr}
          tone="neutral"
        />
        <StatCard
          label="Avg. Order Value"
          value={formatCurrency(analytics.averageOrderValue)}
          description="Based on non-cancelled orders"
          icon={ChartLineUp}
          tone="neutral"
        />
        <StatCard
          label="Unread Inquiries"
          value={analytics.unreadContacts}
          description={
            analytics.unreadContacts > 0
              ? 'Requires customer follow-up'
              : 'Inbox is completely caught up'
          }
          icon={ChatCircleDots}
          tone={analytics.unreadContacts > 0 ? 'warning' : 'neutral'}
        />
        <StatCard
          label="Low Stock Items"
          value={analytics.lowStockProducts.length}
          description={`${analytics.publishedProducts} product(s) live in catalog`}
          icon={WarningCircle}
          tone={analytics.lowStockProducts.length > 0 ? 'danger' : 'neutral'}
        />
      </section>

      {/* Main Operational Row: Recent Orders (1.25fr) & Order Health (0.75fr) */}
      <section className="dashboard-main-grid">
        <div className="card dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <p className="dashboard-panel-eyebrow">Fulfillment</p>
              <h3>Recent Orders</h3>
            </div>
            <Link to="/orders" className="dashboard-panel-action">
              <span>View all orders</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {analytics.recentOrders.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="No orders yet"
              description="Customer orders placed on the storefront will appear here."
              action={
                <Link to="/orders" className="btn-secondary">
                  Go to Orders
                </Link>
              }
            />
          ) : (
            <div className="dashboard-order-list">
              {analytics.recentOrders.map((order) => (
                <div key={order.id} className="dashboard-order-row">
                  <div className="dashboard-order-info">
                    <div className="dashboard-order-customer-line">
                      <strong>{order.customer_name || 'Guest checkout'}</strong>
                      <span className="dashboard-order-id">#{String(order.id).slice(0, 8)}</span>
                    </div>
                    <span className="dashboard-order-date">{formatDate(order.created_at)}</span>
                  </div>
                  <div className="dashboard-order-side">
                    <b>{formatCurrency(safeNumber(order.total_amount, order.total))}</b>
                    <StatusBadge status={getOrderStatusTone(order.status)}>
                      {formatStatusLabel(order.status)}
                    </StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <p className="dashboard-panel-eyebrow">Status Breakdown</p>
              <h3>Order Health</h3>
            </div>
            <span className="dashboard-chip">{analytics.orders} active total</span>
          </div>
          <BarList items={analytics.statusData} total={analytics.orders} />
        </div>
      </section>

      {/* Sales Trend & Inventory Pressure */}
      <section className="dashboard-main-grid">
        <div className="card dashboard-panel dashboard-chart-panel">
          <div className="dashboard-panel-header">
            <div>
              <p className="dashboard-panel-eyebrow">Sales Trend</p>
              <h3>Revenue Over Time</h3>
            </div>
            <span className="dashboard-chip">Last 6 Months</span>
          </div>
          <LineChart data={analytics.monthlyRevenue} />
        </div>

        <div className="card dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <p className="dashboard-panel-eyebrow">Inventory Alert</p>
              <h3>Low Stock Products</h3>
            </div>
            <Link to="/products" className="dashboard-panel-action">
              <span>Manage catalog</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {analytics.lowStockProducts.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Stock levels healthy"
              description="All products currently have 6 or more units in inventory."
            />
          ) : (
            <div className="dashboard-alert-list">
              {analytics.lowStockProducts.map((product) => (
                <div key={product.id} className="dashboard-alert-row">
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.category}</span>
                  </div>
                  <StatusBadge status={product.stock === 0 ? 'danger' : 'warning'}>
                    {product.stock === 0 ? 'Out of stock' : `${product.stock} units left`}
                  </StatusBadge>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Secondary Row: Audience Signals & Storefront Pulse */}
      <section className="dashboard-secondary-grid">
        <div className="card dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <p className="dashboard-panel-eyebrow">Audience Signals</p>
              <h3>Customer Engagement</h3>
            </div>
            <Link to="/contacts" className="dashboard-panel-action">
              <span>Inbox</span>
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="dashboard-audience-grid">
            <div className="dashboard-mini-metric">
              <span>Newsletter Subscribers</span>
              <strong>{analytics.newsletterAudience}</strong>
            </div>
            <div className="dashboard-mini-metric">
              <span>Waitlist Leads</span>
              <strong>{analytics.waitlistAudience}</strong>
            </div>
            <div className="dashboard-mini-metric">
              <span>Unread Inquiries</span>
              <strong>{analytics.unreadContacts}</strong>
            </div>
          </div>
        </div>

        <div className="card dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <p className="dashboard-panel-eyebrow">Storefront Pulse</p>
              <h3>Operational Snapshot</h3>
            </div>
          </div>
          <div className="dashboard-activity-list">
            <div className="dashboard-activity-item">
              <div className="dashboard-activity-icon">
                <ShoppingCart size={18} />
              </div>
              <div>
                <strong>{analytics.orders} confirmed order(s)</strong>
                <span>Active orders currently being fulfilled across the store.</span>
              </div>
            </div>
            <div className="dashboard-activity-item">
              <div className="dashboard-activity-icon">
                <Package size={18} />
              </div>
              <div>
                <strong>{analytics.publishedProducts} catalog product(s)</strong>
                <span>Products currently live and purchasable in the storefront.</span>
              </div>
            </div>
            <div className="dashboard-activity-item">
              <div className="dashboard-activity-icon">
                <ClockCounterClockwise size={18} />
              </div>
              <div>
                <strong>{analytics.waitlistAudience + analytics.newsletterAudience} customer leads</strong>
                <span>Audience members awaiting store drops and newsletter updates.</span>
              </div>
            </div>
            <div className="dashboard-activity-item">
              <div className="dashboard-activity-icon">
                <ChatCircleDots size={18} />
              </div>
              <div>
                <strong>{analytics.unreadContacts} unresolved message(s)</strong>
                <span>Customer service inquiries needing follow-up from the inbox.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
