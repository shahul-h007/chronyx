import React, { useState } from 'react';
import { CaretLeft, CreditCard, Wallet, Bank, Money } from '@phosphor-icons/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { formatCurrency } from '../data/store';
import { supabase } from '../lib/supabase';
import { siteConfig } from '../config/siteConfig';

function PaymentPage({ cartItems, cartTotal, shipping, payment, setPayment, clearCart, setNotice, refreshProducts }) {
  const navigate = useNavigate();
  const location = useLocation();
  const shippingMethod = location.state?.shippingMethod || 'standard';
  
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [storeSettings, setStoreSettings] = useState(null);

  React.useEffect(() => {
    supabase.from('settings').select('value').eq('key', 'store_settings').single().then(({ data }) => {
      if (data) {
        setStoreSettings(data.value);
      }
    });
  }, []);

  React.useEffect(() => {
    if (storeSettings) {
      const availableMethods = [];
      if (storeSettings.upi_enabled) availableMethods.push('UPI');
      if (storeSettings.card_enabled) availableMethods.push('Card');
      if (storeSettings.netbanking_enabled) availableMethods.push('NetBanking');
      if (storeSettings.cod_enabled) availableMethods.push('COD');

      if (availableMethods.length > 0 && !availableMethods.includes(payment.method)) {
        setPayment({ ...payment, method: availableMethods[0] });
      }
    }
  }, [storeSettings, payment.method, setPayment]);

  const shippingFee = shippingMethod === 'express' ? (storeSettings?.express_shipping_fee || 1500) : 0;
  const codFee = storeSettings?.cod_fee || 100;
  const buildServerCartItems = () =>
    cartItems.map((item) => ({
      id: item.id,
      quantity: item.quantity,
    }));

  const applyCoupon = async (e) => {
    e.preventDefault();
    if (!coupon.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', coupon.toUpperCase())
        .eq('is_active', true)
        .single();
      
      if (error || !data) {
        setNotice('Invalid coupon code');
        setDiscount(0);
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setNotice('This coupon has expired');
        setDiscount(0);
        return;
      }

      if (data.max_uses && data.times_used >= data.max_uses) {
        setNotice('This coupon has reached its usage limit');
        setDiscount(0);
        return;
      }

      const discountAmount = cartTotal * (data.discount_percent / 100);
      setDiscount(discountAmount);
      setNotice(`Coupon ${data.code} applied! ${data.discount_percent}% off`);
    } catch (err) {
      setNotice('Invalid coupon code');
      setDiscount(0);
    }
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const assignAuthenticityUnits = async (orderId) => {
    try {
      for (const item of cartItems) {
        const { data: availableUnits, error: fetchError } = await supabase
          .from('product_auth_units')
          .select('id')
          .eq('product_id', item.id)
          .eq('status', 'available')
          .order('serial_number', { ascending: true })
          .limit(item.quantity);

        if (fetchError) throw fetchError;

        if (!availableUnits?.length) {
          continue;
        }

        const selectedUnitIds = availableUnits.map((unit) => unit.id);

        const fallbackGuestEmail = shipping.email || (siteConfig.domain ? `guest@${siteConfig.domain}` : 'guest@chronyx.in');
        const { error: assignError } = await supabase
          .from('product_auth_units')
          .update({
            status: 'assigned',
            order_id: orderId,
            assigned_to_email: fallbackGuestEmail,
            assigned_at: new Date().toISOString(),
          })
          .in('id', selectedUnitIds);

        if (assignError) throw assignError;
      }
    } catch (error) {
      console.error('Failed to assign authenticity units:', error.message);
    }
  };

  const processCodOrder = async () => {
    try {
      const orderData = {
        customer_email: shipping.email || (siteConfig.domain ? `guest@${siteConfig.domain}` : 'guest@chronyx.in'),
        customer_name: shipping.name || 'Guest',
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
        })),
        total_amount: payment.method === 'COD' ? finalTotal + codFee : finalTotal,
        total: payment.method === 'COD' ? finalTotal + codFee : finalTotal,
        status: payment.method === 'COD' ? 'pending' : 'paid',
        shipping_address: {
          address: shipping.address,
          city: shipping.city,
          pincode: shipping.pincode,
          phone: shipping.phone || '',
        },
        payment_method: 'COD',
      };

      const { data: insertedOrder, error } = await supabase.from('orders').insert([orderData]).select().single();
      if (error) throw new Error(error.message || 'Order save error');

      for (const item of cartItems) {
        const { error: stockErr } = await supabase.rpc('decrement_stock', { 
          product_id: item.id, 
          quantity: item.quantity 
        });
        if (stockErr) console.error('Failed to decrement stock:', stockErr);
      }

      if (discount > 0 && coupon.trim()) {
        const { error: couponErr } = await supabase.rpc('increment_coupon_usage', { coupon_code: coupon.toUpperCase() });
        if (couponErr) console.error('Failed to increment coupon:', couponErr);
      }

      await assignAuthenticityUnits(insertedOrder.id);

      if (refreshProducts) {
        refreshProducts();
      }

      clearCart();
      navigate('/confirmation', { state: { order: insertedOrder } });
    } catch (err) {
      console.error('Failed to process order:', err);
      setNotice('Failed to place order. Please try again.');
    }
  };

  const handleNext = async (e) => {
    e.preventDefault();
    
    if (payment.method === 'COD') {
      await processCodOrder();
    } else {
      const res = await loadRazorpay();
      
      if (!res) {
        setNotice('Razorpay SDK failed to load. Are you online?');
        return;
      }

      setNotice('Initializing secure payment...');

      try {
        const { data: orderData, error } = await supabase.functions.invoke('create-razorpay-order', {
          body: {
            cartItems: buildServerCartItems(),
            shippingMethod,
            coupon: coupon.trim() || null,
          }
        });

        if (error || !orderData || !orderData.id) {
          throw new Error(orderData?.error || 'Could not create secure order. Check Razorpay keys in Supabase.');
        }

        if (typeof orderData.discount === 'number') {
          setDiscount(orderData.discount);
        }

        const rzpMethod = payment.method === 'Card' ? 'card' : 
                          payment.method === 'UPI' ? 'upi' : 
                          payment.method === 'NetBanking' ? 'netbanking' : '';

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: orderData.amount, 
          currency: orderData.currency,
          name: storeSettings?.store_name || siteConfig.name || 'Chronyx',
          description: storeSettings?.store_tagline || siteConfig.tagline || 'Luxury Timepieces',
          order_id: orderData.id,
          handler: async function (response) {
            setNotice('Verifying payment...');
            const { data: verificationData, error: verificationError } = await supabase.functions.invoke(
              'verify-razorpay-payment',
              {
                body: {
                  ...response,
                  cartItems: buildServerCartItems(),
                  shipping,
                  shippingMethod,
                  coupon: coupon.trim() || null,
                  paymentMethod: payment.method,
                },
              },
            );

            if (verificationError || !verificationData?.order) {
              console.error('Razorpay verification failed:', verificationError || verificationData);
              setNotice('Payment verification failed. Please contact support if money was debited.');
              return;
            }

            if (refreshProducts) {
              refreshProducts();
            }

            clearCart();
            navigate('/confirmation', { state: { order: verificationData.order } });
          },
          prefill: {
            name: shipping.name,
            email: shipping.email,
            contact: shipping.phone,
            method: rzpMethod
          },
          theme: {
            color: '#B38B59'
          }
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();

      } catch (err) {
        console.error('Razorpay Setup Error:', err);
        setNotice('Payment initialization failed. Please try again.');
      }
    }
  };

  const finalTotal = cartTotal + shippingFee - discount;

  if (cartItems.length === 0) {
    return (
      <div className="page-stack">
        <section className="page-header-panel">
          <h1>Your cart is empty.</h1>
          <Link className="primary-btn" style={{ marginTop: '14px' }} to="/">
            Return home
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="page-header-panel">
        <p className="label">Step 2 of 2</p>
        <h1>Secure Payment</h1>
      </section>
      <section className="checkout-layout">
        <div className="checkout-form-panel">
          <div className="section-heading">
            <h2>Select Payment Method</h2>
            <p className="hero-text">All transactions are secure and encrypted.</p>
          </div>

          <div className="payment-switch" style={{ marginBottom: '24px' }}>
            {(!storeSettings || storeSettings.upi_enabled) && (
              <button
                className={payment.method === 'UPI' ? 'payment-pill active' : 'payment-pill'}
                onClick={() => setPayment({ ...payment, method: 'UPI' })}
              >
                <Wallet size={16} style={{ marginRight: '6px' }} /> UPI
              </button>
            )}
            {(!storeSettings || storeSettings.card_enabled) && (
              <button
                className={payment.method === 'Card' ? 'payment-pill active' : 'payment-pill'}
                onClick={() => setPayment({ ...payment, method: 'Card' })}
              >
                <CreditCard size={16} style={{ marginRight: '6px' }} /> Card
              </button>
            )}
            {(!storeSettings || storeSettings.netbanking_enabled) && (
              <button
                className={payment.method === 'NetBanking' ? 'payment-pill active' : 'payment-pill'}
                onClick={() => setPayment({ ...payment, method: 'NetBanking' })}
              >
                <Bank size={16} style={{ marginRight: '6px' }} /> Net Banking
              </button>
            )}
            {(!storeSettings || storeSettings.cod_enabled) && (
              <button
                className={payment.method === 'COD' ? 'payment-pill active' : 'payment-pill'}
                onClick={() => setPayment({ ...payment, method: 'COD' })}
              >
                <Money size={16} style={{ marginRight: '6px' }} /> COD
              </button>
            )}
          </div>

          <form className="form-grid" onSubmit={handleNext}>
            {payment.method === 'Card' && (
              <div className="full-span" style={{ padding: '16px', background: 'var(--surface-3)', borderRadius: '16px' }}>
                <p style={{ margin: 0 }}>You will enter your credit or debit card details securely in the next step.</p>
              </div>
            )}

            {payment.method === 'UPI' && (
              <div className="full-span" style={{ padding: '16px', background: 'var(--surface-3)', borderRadius: '16px' }}>
                <p style={{ margin: 0 }}>You will enter your UPI ID or scan a QR code securely in the next step.</p>
              </div>
            )}

            {payment.method === 'NetBanking' && (
              <div className="full-span" style={{ padding: '16px', background: 'var(--surface-3)', borderRadius: '16px' }}>
                <p style={{ margin: 0 }}>You will select your bank and log in securely in the next step.</p>
              </div>
            )}

            {payment.method === 'COD' && (
              <div className="full-span" style={{ padding: '16px', background: 'var(--surface-3)', borderRadius: '16px' }}>
                <p style={{ margin: 0 }}>You will pay in cash or via UPI when the delivery arrives. An extra {formatCurrency(codFee)} handling fee applies.</p>
              </div>
            )}

            <div className="form-actions full-span" style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <Link className="icon-btn" to="/checkout">
                <CaretLeft size={18} />
              </Link>
              <button className="primary-btn" type="submit" style={{ flex: 1 }}>
                Pay {formatCurrency(payment.method === 'COD' ? finalTotal + codFee : finalTotal)}
              </button>
            </div>
          </form>
        </div>

        <aside className="summary-panel">
          <p className="label">Order Summary</p>
          <div className="cart-list-panel" style={{ margin: '16px 0' }}>
            {cartItems.map((item) => (
              <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <img src={item.hero} alt={item.name} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{item.name}</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Qty: {item.quantity}</span>
                </div>
                <strong>{formatCurrency(item.lineTotal)}</strong>
              </div>
            ))}
          </div>

          <form onSubmit={applyCoupon} style={{ display: 'flex', gap: '8px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--line)' }}>
            <input 
              type="text" 
              placeholder="Enter promo code" 
              value={coupon}
              onChange={e => setCoupon(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="secondary-btn">Apply</button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
            <span>Subtotal</span>
            <strong>{formatCurrency(cartTotal)}</strong>
          </div>
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', color: 'var(--accent)' }}>
              <span>Discount (LUXURY10)</span>
              <strong>-{formatCurrency(discount)}</strong>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <span>Shipping ({shippingMethod})</span>
            <strong>{shippingFee === 0 ? 'Free' : formatCurrency(shippingFee)}</strong>
          </div>
          {payment.method === 'COD' && (
             <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
             <span>COD Fee</span>
             <strong>{formatCurrency(codFee)}</strong>
           </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
            <span style={{ fontSize: '1.2rem' }}>Total</span>
            <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{formatCurrency(payment.method === 'COD' ? finalTotal + codFee : finalTotal)}</h3>
          </div>
        </aside>
      </section>
    </div>
  );
}

export default PaymentPage;
