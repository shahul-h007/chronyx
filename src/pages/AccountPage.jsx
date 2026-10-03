import React, { useEffect, useMemo, useState } from 'react';
import { DownloadSimple, Heart, Package, SignOut, User } from '@phosphor-icons/react';
import { Link, Navigate } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { supabase } from '../lib/supabase';
import InvoicePDF from '../components/pdf/InvoicePDF';
import { Star } from '@phosphor-icons/react';
import { formatCurrency } from '../data/store';
import { siteConfig } from '../config/siteConfig';

const defaultProfile = {
  name: '',
  phone: '',
  is_newsletter_subscribed: false,
};

function AccountPage({ user }) {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [profile, setProfile] = useState(defaultProfile);
  const [profileId, setProfileId] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchProfile();
    }
  }, [user]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_email', user.email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error.message);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchProfile = async () => {
    setLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfileId(data.id);
        setProfile({
          name: data.name || '',
          phone: data.phone || '',
          is_newsletter_subscribed: Boolean(data.is_newsletter_subscribed),
        });
      } else {
        setProfileId('');
        setProfile(defaultProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error.message);
      setProfileId('');
      setProfile(defaultProfile);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleProfileChange = (event) => {
    const { name, value, type, checked } = event.target;
    setProfile((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);

    try {
      const payload = {
        name: profile.name.trim() || null,
        email: user.email,
        phone: profile.phone.trim() || null,
        is_newsletter_subscribed: profile.is_newsletter_subscribed,
      };

      if (profileId) {
        const { error } = await supabase.from('customers').update(payload).eq('id', profileId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('customers').insert([payload]).select().single();
        if (error) throw error;
        setProfileId(data.id);
      }

      window.dispatchEvent(new CustomEvent('chronyx-notice', { detail: 'Account profile updated.' }));
    } catch (error) {
      console.error('Error saving profile:', error.message);
      window.dispatchEvent(new CustomEvent('chronyx-notice', { detail: 'Failed to update account profile.' }));
    } finally {
      setSavingProfile(false);
    }
  };

  const accountStats = useMemo(() => {
    const deliveredCount = orders.filter((order) => order.status === 'delivered').length;

    return {
      orderCount: orders.length,
      deliveredCount,
    };
  }, [orders]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="page-stack account-page">
      <section className="page-header-panel account-hero">
        <p className="label">My Account</p>
        <h1>Your {siteConfig.name} workspace.</h1>
        <p className="hero-text">
          Track purchases, download invoices, manage saved details, and keep your account ready for the next release.
        </p>
      </section>

      <section className="account-shell">
        <aside className="account-sidebar catalog-section">
          <div className="account-sidebar-group">
            <button
              className={activeTab === 'orders' ? 'account-nav-btn is-active' : 'account-nav-btn'}
              onClick={() => setActiveTab('orders')}
            >
              <Package size={18} />
              Order History
            </button>
            <button
              className={activeTab === 'profile' ? 'account-nav-btn is-active' : 'account-nav-btn'}
              onClick={() => setActiveTab('profile')}
            >
              <User size={18} />
              Profile Settings
            </button>
            <Link className="account-nav-btn" to="/shop?wishlist=true">
              <Heart size={18} />
              Saved Items
            </Link>
          </div>

          <div className="account-sidebar-divider" />

          <div className="account-sidebar-meta">
            <div>
              <span className="label">Signed in as</span>
              <strong>{user.email}</strong>
            </div>
            <button onClick={handleSignOut} className="account-signout-btn">
              <SignOut size={18} />
              Sign Out
            </button>
          </div>
        </aside>

        <div className="account-main">
          <div className="account-stats">
            <article className="account-stat-card">
              <span className="label">Orders</span>
              <strong>{accountStats.orderCount}</strong>
            </article>
            <article className="account-stat-card">
              <span className="label">Delivered</span>
              <strong>{accountStats.deliveredCount}</strong>
            </article>
          </div>

          <section className="summary-panel account-panel">
            {activeTab === 'orders' ? (
              <div className="account-orders">
                <div className="account-panel-heading">
                  <h2>Recent Orders</h2>
                  <p>Invoices and order status for every purchase linked to your email address.</p>
                </div>

                {loadingOrders ? (
                  <div className="account-empty-state">Loading your orders...</div>
                ) : orders.length === 0 ? (
                  <div className="account-empty-state">You have not placed any orders yet.</div>
                ) : (
                  <div className="account-order-list">
                    {orders.map((order) => {
                      const displayId = order.id
                        ? `KRX-${new Date(order.created_at || Date.now()).getFullYear()}-${order.id.slice(0, 8).toUpperCase()}`
                        : 'KRX-XXXX';

                      return (
                        <article key={order.id} className="account-order-card">
                          <div className="account-order-top">
                            <div>
                              <span className="label">Order</span>
                              <strong>{displayId}</strong>
                            </div>
                            <span className={`account-order-status is-${order.status}`}>
                              {order.status}
                            </span>
                          </div>

                          <div className="account-order-meta">
                            <div>
                              <span className="label">Placed</span>
                              <strong>{new Date(order.created_at).toLocaleDateString()}</strong>
                            </div>
                            <div>
                              <span className="label">Items</span>
                              <strong>{order.items?.length || 1}</strong>
                            </div>
                            <div>
                              <span className="label">Total</span>
                              <strong>{formatCurrency(order.total_amount || order.total || 0)}</strong>
                            </div>
                          </div>

                          <div className="account-order-actions">
                            <PDFDownloadLink
                              document={<InvoicePDF order={order} />}
                              fileName={`${siteConfig.name}_Invoice_${displayId}.pdf`}
                              style={{ textDecoration: 'none' }}
                            >
                              {({ loading }) => (
                                <button className="secondary-btn" disabled={loading}>
                                  <DownloadSimple size={16} />
                                  {loading ? 'Preparing Invoice...' : 'Download Invoice'}
                                </button>
                              )}
                            </PDFDownloadLink>
                            {order.status === 'delivered' && (
                              <Link to={`/review/${order.id}`} className="primary-btn" style={{ textDecoration: 'none' }}>
                                <Star size={16} weight="fill" />
                                Rate & Review
                              </Link>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="account-profile">
                <div className="account-panel-heading">
                  <h2>Profile Settings</h2>
                  <p>Keep your contact details ready for faster checkout and order communication.</p>
                </div>

                {loadingProfile ? (
                  <div className="account-empty-state">Loading your profile...</div>
                ) : (
                  <form className="form-grid account-profile-form" onSubmit={handleSaveProfile}>
                    <label>
                      Full Name
                      <input
                        type="text"
                        name="name"
                        value={profile.name}
                        onChange={handleProfileChange}
                        placeholder="Your full name"
                      />
                    </label>

                    <label>
                      Email Address
                      <input type="email" value={user.email} disabled className="is-disabled-input" />
                    </label>

                    <label>
                      Phone Number
                      <input
                        type="tel"
                        name="phone"
                        value={profile.phone}
                        onChange={handleProfileChange}
                        placeholder="+91 98765 43210"
                      />
                    </label>

                    <label className="account-checkbox-row">
                      <input
                        type="checkbox"
                        name="is_newsletter_subscribed"
                        checked={profile.is_newsletter_subscribed}
                        onChange={handleProfileChange}
                      />
                      <span>Keep me updated on new drops and limited releases.</span>
                    </label>

                    <div className="account-profile-actions">
                      <button type="submit" className="primary-btn" disabled={savingProfile}>
                        {savingProfile ? 'Saving Profile...' : 'Save Profile'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

export default AccountPage;
