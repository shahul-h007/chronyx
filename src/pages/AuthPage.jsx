import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeSlash } from '@phosphor-icons/react';
import { supabase } from '../lib/supabase';
import { siteConfig } from '../config/siteConfig';

const SITE_URL = import.meta.env.VITE_SITE_URL || (siteConfig.domain ? `https://${siteConfig.domain}` : 'https://chronyx.in');

const inputStyle = {
  width: '100%',
  padding: '12px',
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  color: 'var(--text)',
  borderRadius: '8px',
};

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  color: 'var(--text-secondary)',
};

const passwordToggleStyle = {
  position: 'absolute',
  top: '50%',
  right: '10px',
  transform: 'translateY(-50%)',
  width: '32px',
  height: '32px',
  display: 'grid',
  placeItems: 'center',
  border: 'none',
  background: 'transparent',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
};

function AuthPage({ user }) {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const searchParams = new URLSearchParams(window.location.search);
  const returnTo = searchParams.get('returnTo') || '/account';

  if (user) {
    return <Navigate to={returnTo} replace />;
  }

  const resetPasswordFields = () => {
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const cleanedName = fullName.trim();
        const cleanedPhone = phone.replace(/\D/g, '');
        const numericAge = Number(age);

        if (!cleanedName) throw new Error('Full name is required.');
        if (cleanedPhone.length < 10) throw new Error('Enter a valid phone number.');
        if (!Number.isInteger(numericAge) || numericAge < 13) {
          throw new Error('You must be at least 13 years old to create an account.');
        }
        if (password.length < 8) throw new Error('Password must be at least 8 characters.');
        if (password !== confirmPassword) throw new Error('Passwords do not match.');

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${SITE_URL}/auth`,
            data: {
              full_name: cleanedName,
              phone: cleanedPhone,
              age: numericAge,
            },
          },
        });
        if (error) throw error;

        await Promise.allSettled([
          supabase.from('customers').insert([{
            name: cleanedName,
            email,
            phone: cleanedPhone,
            is_newsletter_subscribed: true,
          }]),
          supabase.from('subscribers').insert([{ email, source: 'signup' }]),
        ]);

        setMessage({ text: 'Check your email for the confirmation link!', type: 'success' });
      }
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-stack" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div style={{ maxWidth: '460px', width: '100%', padding: '40px', background: 'var(--surface-2)', borderRadius: '24px', border: '1px solid var(--line)' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '2rem' }}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          {isLogin ? 'Sign in to access your orders and saved items.' : `Join ${siteConfig.name} to track orders and save favorites.`}
        </p>

        {message.text && (
          <div style={{ padding: '12px', background: message.type === 'error' ? '#D32F2F' : '#388E3C', color: 'white', borderRadius: '8px', marginBottom: '24px', fontSize: '0.9rem', textAlign: 'center' }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!isLogin && (
            <>
              <div>
                <label htmlFor="signupFullName" style={labelStyle}>Full Name</label>
                <input
                  id="signupFullName"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Your full name"
                  style={inputStyle}
                />
              </div>

              <div className="auth-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 110px', gap: '12px' }}>
                <div>
                  <label htmlFor="signupPhone" style={labelStyle}>Phone Number</label>
                  <input
                    id="signupPhone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    required
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="9876543210"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label htmlFor="signupAge" style={labelStyle}>Age</label>
                  <input
                    id="signupAge"
                    type="number"
                    value={age}
                    onChange={(event) => setAge(event.target.value)}
                    required
                    min="13"
                    max="120"
                    inputMode="numeric"
                    placeholder="18"
                    style={inputStyle}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="authEmail" style={labelStyle}>Email Address</label>
            <input
              id="authEmail"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              placeholder="name@example.com"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="authPassword" style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="authPassword"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={isLogin ? undefined : 8}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                placeholder={isLogin ? 'Enter your password' : 'Minimum 8 characters'}
                style={{ ...inputStyle, paddingRight: '46px' }}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((current) => !current)}
                style={passwordToggleStyle}
              >
                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label htmlFor="signupConfirmPassword" style={labelStyle}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="signupConfirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength="8"
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  style={{ ...inputStyle, paddingRight: '46px' }}
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? 'Hide repeated password' : 'Show repeated password'}
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  style={passwordToggleStyle}
                >
                  {showConfirmPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="primary-btn"
            disabled={loading}
            style={{ width: '100%', marginTop: '12px', display: 'flex', justifyContent: 'center', padding: '14px' }}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')} <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <button
            onClick={() => {
              setIsLogin((current) => !current);
              setMessage({ text: '', type: '' });
              resetPasswordFields();
            }}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
