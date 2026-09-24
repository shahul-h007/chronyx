import React, { useEffect, useMemo, useState, useRef, Suspense, lazy } from 'react';
import Lenis from 'lenis';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { WhatsappLogo } from '@phosphor-icons/react';

import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';
import ConsentPrompt from './components/ConsentPrompt';
import ExitIntentPopup from './components/ExitIntentPopup';
import BackToTop from './components/BackToTop';
import Analytics from './components/Analytics';
import SiteSchemas from './components/SiteSchemas';
import { buildSiteContent, defaultSiteContent } from './lib/siteContent';
import { siteConfig } from './config/siteConfig';

import {
  initialPayment,
  initialShipping,
  loadCart,
} from './data/store';
import { supabase } from './lib/supabase';
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const ConfirmationPage = lazy(() => import('./pages/ConfirmationPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const JournalArticlePage = lazy(() => import('./pages/JournalArticlePage'));
const VerifyProductPage = lazy(() => import('./pages/VerifyProductPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const ReviewPage = lazy(() => import('./pages/ReviewPage'));
const TrackingPage = lazy(() => import('./pages/TrackingPage'));
const PoliciesPage = lazy(() => import('./pages/PoliciesPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const CollectionPage = lazy(() => import('./pages/CollectionPage'));
const PlacementGuidePage = lazy(() => import('./pages/PlacementGuidePage'));
const LocationPage = lazy(() => import('./pages/LocationPage'));

gsap.registerPlugin(ScrollTrigger);

function App() {
  return (
    <BrowserRouter>
      <StoreApp />
    </BrowserRouter>
  );
}

const DEFAULT_STORE_SETTINGS = {
  maintenance_mode: false,
  cod_enabled: true,
  cod_fee: 100,
  free_shipping_threshold: 50000,
  store_name: siteConfig.name,
  contact_email: siteConfig.contactEmail,
  whatsapp_number: '',
  express_shipping_enabled: false,
  express_shipping_fee: 1500,
  upi_enabled: true,
  card_enabled: true,
  netbanking_enabled: true,
  show_journal: false,
};

function StoreApp() {
  const [theme, setTheme] = useState('maple');
  const [splashDone, setSplashDone] = useState(false);
  const [cart, setCart] = useState(loadCart);
  const [shipping, setShipping] = useState(initialShipping);
  const [payment, setPayment] = useState(initialPayment);
  const [notice, setNotice] = useState('');
  
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem(siteConfig.storage.wishlistKey) || '[]');
    } catch {
      return [];
    }
  });

  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [siteContent, setSiteContent] = useState(defaultSiteContent);
  const [storeSettings, setStoreSettings] = useState(DEFAULT_STORE_SETTINGS);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`*, product_images(image_url, is_hero)`);
      
      if (error) throw error;

      const mappedProducts = data.map(p => {
        const heroImg = p.product_images?.find(img => img.is_hero)?.image_url || p.product_images?.[0]?.image_url || '';
        const gallery = p.product_images?.map(img => img.image_url) || [];
        const stockQuantity = Number(
          p.stock_quantity ?? p.stock ?? 0,
        );
        const stockLevelPercent = Math.max(0, Math.min(100, stockQuantity * 10));

        return {
          id: p.id,
          name: p.name,
          tagline: p.tagline || p.description,
          category: p.category,
          price: Number(p.price),
          stockQuantity,
          stockLevelPercent,
          size: p.size,
          finish: p.finish,
          material: p.material,
          movementType: p.movement_type,
          careInstructions: p.care_instructions || [],
          tags: p.tags || [],
          dropDate: p.drop_date,
          hero: heroImg,
          gallery: gallery,
          summary: p.summary,
          story: p.story || p.description,
          features: p.features || [],
          created_at: p.created_at,
          video_url: p.video_url || '',
          video_embed_url: p.video_embed_url || '',
          video_thumbnail_url: p.video_thumbnail_url || '',
          video_title: p.video_title || '',
          video_description: p.video_description || '',
          video_duration_seconds: p.video_duration_seconds || null,
          video_upload_date: p.video_upload_date || null,
          video_view_count: p.video_view_count || 0,
          video_transcript: p.video_transcript || '',
          video_srt_url: p.video_srt_url || '',
        };
      });

      setProducts(mappedProducts);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const { data, error } = await supabase
          .from('collections')
          .select('*, collection_products(product_id, sort_order)')
          .order('sort_order', { ascending: true });

        if (error) throw error;
        setCollections(data || []);
      } catch (error) {
        console.error('Failed to fetch collections', error);
        setCollections([]);
      }
    };

    fetchCollections();
  }, []);

  useEffect(() => {
    const fetchSiteContent = async () => {
      try {
        const { data, error } = await supabase.from('settings').select('key, value');
        if (error) throw error;
        setSiteContent(buildSiteContent(data || []));
        const settingsRow = (data || []).find((item) => item.key === 'store_settings');
        setStoreSettings((current) => ({ ...current, ...(settingsRow?.value || {}) }));
      } catch (error) {
        console.error('Failed to fetch site content', error);
        setSiteContent(defaultSiteContent);
        setStoreSettings(DEFAULT_STORE_SETTINGS);
      }
    };

    fetchSiteContent();
  }, []);

  const location = useLocation();
  const mainRef = useRef(null);
  const lenisRef = useRef(null);

  const cartItems = cart
    .map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      if (!product) return null;
      return { ...product, quantity: item.quantity, lineTotal: item.quantity * product.price };
    })
    .filter(Boolean);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);

  useEffect(() => {
    const timer = window.setTimeout(() => setSplashDone(true), 700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'maple') html.setAttribute('data-theme', 'maple');
    else html.removeAttribute('data-theme');
  }, [theme]);

  useEffect(() => {
    try {
      window.localStorage.setItem(siteConfig.storage.cartKey, JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    try {
      window.localStorage.setItem(siteConfig.storage.wishlistKey, JSON.stringify(wishlist));
    } catch {}
  }, [wishlist]);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true, smoothTouch: false });
    lenisRef.current = lenis;
    let frame = 0;

    const raf = (time) => {
      lenis.raf(time);
      frame = window.requestAnimationFrame(raf);
    };

    frame = window.requestAnimationFrame(raf);
    return () => {
      window.cancelAnimationFrame(frame);
      lenisRef.current = null;
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const lenis = lenisRef.current;
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    ScrollTrigger.clearScrollMemory('manual');

    if (lenis) {
      lenis.stop();
      lenis.scrollTo(0, { immediate: true, force: true });
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }

    if (mainRef.current) {
      gsap.set(mainRef.current, { clearProps: 'opacity,transform' });
    }

    const resumeId = window.requestAnimationFrame(() => {
      if (lenis) {
        lenis.start();
      }
      ScrollTrigger.refresh();
    });

    return () => window.cancelAnimationFrame(resumeId);
  }, [location.pathname]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const revealSelectors = [
      '.page-header-panel',
      '.catalog-section',
      '.summary-panel',
      '.product-page-hero',
      '.checkout-layout',
      '.home-v2-feature',
      '.home-v2-values',
      '.home-v2-statement',
      '.home-v2-shop-preview',
      '.home-v2-process',
      '.home-v2-social-proof',
      '.home-v2-final-cta',
      '.product-card',
      '.testimonial-quote-card',
      '.collection-discovery-card',
      '.info-block',
      '.review-card',
    ].join(',');

    let observer;
    const setupId = window.setTimeout(() => {
      const elements = Array.from(document.querySelectorAll(revealSelectors));
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          });
        },
        { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
      );

      elements.forEach((element, index) => {
        element.classList.add('scroll-reveal');
        element.style.setProperty('--reveal-delay', `${Math.min(index % 6, 5) * 42}ms`);
        observer.observe(element);
      });
    }, 120);

    return () => {
      window.clearTimeout(setupId);
      if (observer) observer.disconnect();
      document.querySelectorAll('.scroll-reveal').forEach((element) => {
        element.classList.remove('scroll-reveal', 'is-visible');
        element.style.removeProperty('--reveal-delay');
      });
    };
  }, [location.pathname, loadingProducts]);

  useEffect(() => {
    if (!notice) return undefined;

    const timer = window.setTimeout(() => {
      setNotice('');
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    setNotice('');
  }, [location.pathname]);

  useEffect(() => {
    const handleGlobalNotice = (event) => {
      if (event?.detail) {
        setNotice(String(event.detail));
      }
    };

    window.addEventListener('chronyx-notice', handleGlobalNotice);
    return () => window.removeEventListener('chronyx-notice', handleGlobalNotice);
  }, []);

  const addToCart = (productId) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;

    setCart((current) => {
      const existing = current.find((item) => item.productId === productId);
      if (existing) {
        return current.map((item) =>
          item.productId === productId ? { ...item, quantity: Math.min(item.quantity + 1, 3) } : item,
        );
      }
      return [...current, { productId, quantity: 1 }];
    });
  };

  const toggleWishlist = (productId) => {
    setWishlist(curr => 
      curr.includes(productId) ? curr.filter(id => id !== productId) : [...curr, productId]
    );
  };

  const updateCartQuantity = (productId, nextQuantity) => {
    setCart((current) =>
      current
        .map((item) => (item.productId === productId ? { ...item, quantity: nextQuantity } : item))
        .filter((item) => item.quantity > 0),
    );
  };

  const clearCart = () => setCart([]);

  const deliveryDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }, []);

  const publicStoreName = String(storeSettings.store_name || DEFAULT_STORE_SETTINGS.store_name).trim() || siteConfig.name;
  const whatsappNumber = String(storeSettings.whatsapp_number || '')
    .replace(/\D/g, '')
    .replace(/^0+/, '');

  return (
    <div className="chronyx-app">
      <Analytics />
      <SiteSchemas />
      <div className={splashDone ? 'splash-screen is-hidden' : 'splash-screen'}>
        <span>{siteConfig.name}</span>
      </div>

      <SiteHeader
        cartCount={cartCount}
        theme={theme}
        setTheme={setTheme}
        notice={notice}
        setNotice={setNotice}
        wishlistCount={wishlist.length}
        user={user}
        showJournal={Boolean(storeSettings.show_journal)}
        storeName={publicStoreName}
        navContent={siteContent.navContent}
      />

      <main className="app-main" ref={mainRef}>
        <div className="route-motion-stage" key={location.pathname}>
        {storeSettings.maintenance_mode ? (
          <section className="page-stack">
            <section className="page-header-panel">
              <p className="label">Store Maintenance</p>
              <h1>{publicStoreName} is temporarily unavailable.</h1>
              <p className="hero-text">
                We are making a few updates behind the scenes. Please check back shortly.
              </p>
            </section>
          </section>
        ) : loadingProducts ? (
          <div style={{ padding: '100px', textAlign: 'center' }}>Loading store...</div>
        ) : (
        <Suspense fallback={<div className="page-stack" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="loader"></div></div>}>
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  addToCart={addToCart}
                  deliveryDate={deliveryDate}
                  setNotice={setNotice}
                  products={products}
                  collections={collections}
                  siteContent={siteContent}
                />
              }
            />
            <Route
              path="/products/:productId"
              element={<ProductPage addToCart={addToCart} products={products} />}
            />
            <Route path="/verify/unit/:unitId" element={<VerifyProductPage products={products} />} />
            <Route
              path="/cart"
              element={
                <CartPage
                  cartItems={cartItems}
                  cartTotal={cartTotal}
                  updateCartQuantity={updateCartQuantity}
                  clearCart={clearCart}
                  products={products}
                  user={user}
                  storeSettings={storeSettings}
                />
              }
            />
            <Route
              path="/checkout"
              element={
                <CheckoutPage
                  cartItems={cartItems}
                  cartTotal={cartTotal}
                  shipping={shipping}
                  setShipping={setShipping}
                  user={user}
                />
              }
            />
            <Route
              path="/payment"
              element={
                <PaymentPage
                  cartItems={cartItems}
                  cartTotal={cartTotal}
                  shipping={shipping}
                  payment={payment}
                  setPayment={setPayment}
                  clearCart={clearCart}
                  setNotice={setNotice}
                  refreshProducts={fetchProducts}
                />
              }
            />
            <Route path="/confirmation" element={<ConfirmationPage />} />
            <Route path="/shop" element={<ShopPage addToCart={addToCart} setNotice={setNotice} toggleWishlist={toggleWishlist} wishlist={wishlist} products={products} collections={collections} />} />
            <Route path="/collections/:slug" element={<CollectionPage products={products} collections={collections} addToCart={addToCart} setNotice={setNotice} toggleWishlist={toggleWishlist} wishlist={wishlist} />} />
            <Route path="/review/:orderId" element={<ReviewPage user={user} />} />
            <Route path="/about" element={<AboutPage siteContent={siteContent} />} />
            <Route path="/contact" element={<ContactPage siteContent={siteContent} storeSettings={storeSettings} />} />
            <Route
              path="/blog"
              element={storeSettings.show_journal ? <BlogPage /> : <Navigate to="/" replace />}
            />
            <Route
              path="/journal/:slug"
              element={storeSettings.show_journal ? <JournalArticlePage products={products} /> : <Navigate to="/" replace />}
            />
            <Route path="/account" element={<AccountPage user={user} />} />
            <Route path="/auth" element={<AuthPage user={user} />} />
            <Route path="/track" element={<TrackingPage />} />
            <Route path="/policies" element={<PoliciesPage siteContent={siteContent} />} />
            <Route path="/guides/wall-clock-placement" element={<PlacementGuidePage />} />
            <Route path="/locations/:city" element={<LocationPage products={products} />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        )}
        </div>
      </main>

      <SiteFooter
        footerContent={siteContent.footerContent}
        showJournal={Boolean(storeSettings.show_journal)}
        storeName={publicStoreName}
      />
      <ConsentPrompt />
      <ExitIntentPopup user={user} />
      <BackToTop />
      
      {whatsappNumber ? (
        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="whatsapp-widget"
          aria-label={`Chat with ${publicStoreName} on WhatsApp`}
        >
          <WhatsappLogo size={32} weight="fill" />
        </a>
      ) : null}
    </div>
  );
}

export default App;
