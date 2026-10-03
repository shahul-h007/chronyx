import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { adminConfig } from '../config/adminConfig';
import {
  SquaresFour,
  Package,
  ShoppingCart,
  Browsers,
  Megaphone,
  Gear,
  SignOut,
  ChatCircleDots,
  Newspaper,
  Stack,
  Rows,
  Globe,
  List,
  X,
  ArrowSquareOut,
} from '@phosphor-icons/react';

const NAV_GROUPS = [
  {
    title: 'OVERVIEW',
    items: [
      { path: '/', label: 'Dashboard', icon: SquaresFour, end: true },
    ],
  },
  {
    title: 'COMMERCE',
    items: [
      { path: '/products', label: 'Products', icon: Package },
      { path: '/collections', label: 'Collections', icon: Stack },
      { path: '/orders', label: 'Orders', icon: ShoppingCart },
    ],
  },
  {
    title: 'STOREFRONT',
    items: [
      { path: '/content', label: 'Pages & Content', icon: Browsers },
      { path: '/navigation', label: 'Navigation', icon: Rows },
      { path: '/journal', label: 'Journal', icon: Newspaper },
      { path: '/seo', label: 'SEO', icon: Globe },
    ],
  },
  {
    title: 'CUSTOMERS & MARKETING',
    items: [
      { path: '/contacts', label: 'Inquiries', icon: ChatCircleDots },
      { path: '/marketing', label: 'Marketing', icon: Megaphone },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { path: '/settings', label: 'Settings', icon: Gear },
    ],
  },
];

const ROUTE_TITLES = {
  '/': 'Dashboard',
  '/products': 'Products',
  '/products/new': 'New Product',
  '/collections': 'Collections',
  '/orders': 'Orders',
  '/content': 'Pages & Content',
  '/navigation': 'Navigation',
  '/journal': 'Journal',
  '/seo': 'SEO',
  '/contacts': 'Inquiries',
  '/marketing': 'Marketing',
  '/settings': 'Settings',
};

const getPageTitle = (pathname) => {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  if (pathname.startsWith('/products/')) return 'Edit Product';
  return 'Admin';
};

const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="admin-layout">
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="sidebar-brand-name">{adminConfig.storeName || 'Store'}</span>
            <span className="sidebar-brand-badge">{adminConfig.adminLabel || 'Admin'}</span>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="nav-section">
              <div className="nav-section-title">{group.title}</div>
              <div className="nav-section-items">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.end}
                      className={({ isActive }) =>
                        isActive ? 'nav-item active' : 'nav-item'
                      }
                    >
                      <Icon size={18} weight="regular" className="nav-icon" />
                      <span className="nav-label">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="nav-item nav-item-action"
            onClick={async () => await supabase.auth.signOut()}
          >
            <SignOut size={18} weight="regular" className="nav-icon" />
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <List size={22} />
            </button>
            <div className="topbar-breadcrumb">
              <span className="topbar-context">{pageTitle}</span>
            </div>
          </div>

          <div className="topbar-right">
            {adminConfig.storefrontUrl && (
              <a
                href={adminConfig.storefrontUrl}
                target="_blank"
                rel="noreferrer"
                className="topbar-store-link"
                title="View storefront in new tab"
              >
                <span>View Store</span>
                <ArrowSquareOut size={16} />
              </a>
            )}
            <div className="topbar-user">
              <div className="topbar-user-avatar">A</div>
              <span className="topbar-user-role">Admin</span>
            </div>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
