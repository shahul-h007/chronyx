import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import AdminLayout from './components/AdminLayout';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Contacts from './pages/Contacts';
import Content from './pages/Content';
import Journal from './pages/Journal';
import Collections from './pages/Collections';
import NavigationManager from './pages/NavigationManager';
import Settings from './pages/Settings';
import Marketing from './pages/Marketing';
import SEOManager from './pages/SEOManager';
import Login from './pages/Login';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      verifyAdmin(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      verifyAdmin(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const verifyAdmin = async (session) => {
    if (session) {
      if (session.user.email !== adminEmail) {
        // Kick them out if they are not the admin
        alert('Access Denied: You do not have administrator privileges.');
        await supabase.auth.signOut();
        setSession(null);
      } else {
        setSession(session);
      }
    } else {
      setSession(null);
    }
    setLoading(false);
  };

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>Loading Admin Panel...</div>;
  }

  if (!session) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id" element={<ProductForm />} />
          <Route path="orders" element={<Orders />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="content" element={<Content />} />
          <Route path="journal" element={<Journal />} />
          <Route path="collections" element={<Collections />} />
          <Route path="navigation" element={<NavigationManager />} />
          <Route path="marketing" element={<Marketing />} />
          <Route path="seo" element={<SEOManager />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
