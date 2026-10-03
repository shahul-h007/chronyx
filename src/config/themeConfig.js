/**
 * Master E-commerce Template - Theme Configuration System
 * Separates visual identity from reusable storefront components.
 * The default theme preserves the Chronyx handcrafted aesthetic.
 */

export const themes = {
  chronyx: {
    id: 'chronyx',
    name: 'Chronyx Heirloom (Default)',
    fonts: {
      display: "'Playfair Display', Georgia, serif",
      body: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      mono: "'DM Mono', 'Courier New', monospace",
    },
    colors: {
      background: '#f5f5f7',
      surface: '#ffffff',
      surfaceAlt: '#faf7f2',
      text: '#1a1108',
      textMuted: '#6b6156',
      border: '#d8d2cb',
      primary: '#1a1108',
      accent: '#3a2e1e',
      accentSubtle: '#c8a97e',
    },
    radii: {
      sm: '10px',
      md: '16px',
      lg: '22px',
      pill: '999px',
    },
  },

  minimal: {
    id: 'minimal',
    name: 'Modern Minimalist',
    fonts: {
      display: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      mono: "'JetBrains Mono', monospace",
    },
    colors: {
      background: '#ffffff',
      surface: '#f9fafb',
      surfaceAlt: '#f3f4f6',
      text: '#111827',
      textMuted: '#6b7280',
      border: '#e5e7eb',
      primary: '#000000',
      accent: '#2563eb',
      accentSubtle: '#dbeafe',
    },
    radii: {
      sm: '4px',
      md: '8px',
      lg: '12px',
      pill: '999px',
    },
  },

  warmEditorial: {
    id: 'warm-editorial',
    name: 'Warm Editorial & Apparel',
    fonts: {
      display: "'Cormorant Garamond', Georgia, serif",
      body: "'Plus Jakarta Sans', sans-serif",
      mono: "monospace",
    },
    colors: {
      background: '#fcfbf7',
      surface: '#ffffff',
      surfaceAlt: '#f5f2eb',
      text: '#24201d',
      textMuted: '#787069',
      border: '#e6e1d6',
      primary: '#24201d',
      accent: '#915338',
      accentSubtle: '#e6c8b8',
    },
    radii: {
      sm: '6px',
      md: '12px',
      lg: '18px',
      pill: '999px',
    },
  },
};

export const defaultTheme = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_THEME) || 'chronyx';

/**
 * Maps logical theme identifier to data-theme CSS token selector value.
 */
export function resolveDataTheme(themeId = defaultTheme) {
  if (themeId === 'chronyx') return 'maple';
  if (themeId === 'warmEditorial' || themeId === 'warm-editorial') return 'warm-editorial';
  if (themeId === 'minimal') return 'minimal';
  return themes[themeId]?.id || 'maple';
}

/**
 * Initializes the storefront theme on document element.
 */
export function initializeTheme(themeId = defaultTheme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', resolveDataTheme(themeId));
}

export default themes;
