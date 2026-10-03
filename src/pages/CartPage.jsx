import React from 'react';
import { CaretLeft, CaretRight, Truck, ShoppingCart } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../data/store';
import { siteConfig } from '../config/siteConfig';

function CartPage({ cartItems, cartTotal, updateCartQuantity, clearCart, user, storeSettings }) {
  const freeShippingThreshold = Number(storeSettings?.free_shipping_threshold || 50000);
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - cartTotal);
  const progressPercent =
    freeShippingThreshold > 0 ? Math.min(100, (cartTotal / freeShippingThreshold) * 100) : 100;

  if (cartItems.length === 0) {
    return (
      <div className="page-stack" style={{ alignItems: 'center', minHeight: '60vh', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          <ShoppingCart size={64} color="var(--accent)" weight="duotone" />
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '12px' }}>Your cart is empty.</h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              You haven't added any timepieces yet. Discover our collection of precision-crafted wooden wall clocks.
            </p>
          </div>
          <Link className="primary-btn" to="/" style={{ padding: '16px 32px' }}>
            Return to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="page-header-panel">
        <p className="label">Cart</p>
        <h1>Review your selected {siteConfig.name} pieces.</h1>
      </section>
      
      <section className="shipping-banner" style={{ padding: '16px 24px', background: 'var(--surface-2)', borderRadius: '18px', border: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <Truck size={24} color="var(--accent)" />
          <strong>
            {amountToFreeShipping > 0 
              ? `Add ${formatCurrency(amountToFreeShipping)} more for free standard shipping.`
              : "You've unlocked free standard shipping!"}
          </strong>
        </div>
        <div className="battery-bar" style={{ height: '8px', background: 'var(--surface-3)' }}>
          <div style={{ width: `${progressPercent}%`, transition: 'width 0.4s ease' }} />
        </div>
      </section>

      <section className="cart-page-layout">
        <div className="cart-list-panel">
          {cartItems.map((item) => (
            <article className="cart-row" key={item.id} style={{ padding: 0, border: 'none', background: 'transparent' }}>
              <Link to={`/products/${item.id}`}>
                <img src={item.hero} alt={item.name} style={{ borderRadius: '12px' }} />
              </Link>
              <div className="cart-row-copy">
                <p className="label">{item.category}</p>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{item.name}</h3>
                <span>{formatCurrency(item.price)}</span>
              </div>
              <div className="quantity-controls">
                <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)}>
                  <CaretLeft size={16} />
                </button>
                <strong>{item.quantity}</strong>
                <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)}>
                  <CaretRight size={16} />
                </button>
              </div>
              <strong>{formatCurrency(item.lineTotal)}</strong>
            </article>
          ))}
        </div>
        
        <aside className="summary-panel">
          <p className="label">Summary</p>
          <h3>{formatCurrency(cartTotal)}</h3>
          <p>Shipping and payment happen on dedicated next steps, not on the homepage.</p>
          <div className="summary-actions">
            {user ? (
              <Link className="primary-btn" to="/checkout">
                Continue to checkout
              </Link>
            ) : (
              <Link className="primary-btn" to="/auth" state={{ returnTo: '/checkout' }}>
                Login to Checkout
              </Link>
            )}
            <button className="secondary-btn" onClick={clearCart}>
              Clear cart
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}

export default CartPage;
