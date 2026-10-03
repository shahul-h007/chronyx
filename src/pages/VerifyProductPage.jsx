import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import SEO from '../components/SEO';
import { supabase } from '../lib/supabase';
import { buildUnitQrCodeUrl } from '../lib/productIdentity';
import { siteConfig } from '../config/siteConfig';

function VerifyProductPage({ products = [] }) {
  const { unitId } = useParams();
  const location = useLocation();
  const queryCode = new URLSearchParams(location.search).get('code') || '';

  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState(null);
  const [unitError, setUnitError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadUnit = async () => {
      setLoading(true);
      setUnitError('');

      try {
        const { data, error } = await supabase
          .rpc('verify_product_auth_unit', {
            lookup_public_unit_id: unitId,
            lookup_authenticity_code: queryCode,
          });

        if (error) throw error;

        if (!cancelled) {
          setUnit(data?.[0] || null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading authenticity unit:', error.message);
          setUnit(null);
          setUnitError(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (unitId) {
      loadUnit();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [queryCode, unitId]);

  const product = useMemo(() => {
    if (!unit?.product_id) return null;
    return products.find((entry) => entry.id === unit.product_id) || null;
  }, [products, unit]);

  const verified = Boolean(unit?.verified);
  const qrCodeUrl = unit ? buildUnitQrCodeUrl({ ...unit, authenticity_code: queryCode }) : '';

  if (loading) {
    return (
      <div className="page-stack">
        <section className="page-header-panel">
          <p className="label">Product Verification</p>
          <h1>Checking authenticity record...</h1>
          <p className="hero-text">Please wait while we verify this {siteConfig.name} certificate.</p>
        </section>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="page-stack">
        <SEO
          title={`Verify ${siteConfig.name} Product`}
          description={`Check whether a ${siteConfig.name} authenticity certificate is valid.`}
          path={`/verify/unit/${unitId || ''}`}
        />
        <section className="page-header-panel">
          <p className="label">Product Verification</p>
          <h1>Certificate not found.</h1>
          <p className="hero-text">
            {unitError
              ? `The authenticity registry is not fully configured yet. Please contact ${siteConfig.name} support if you expected this certificate to be active.`
              : `The scanned certificate could not be matched with an active ${siteConfig.name} authenticity record.`}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <SEO
        title={`Verify ${unit.public_unit_id}`}
        description={`Verify ${siteConfig.name} authenticity certificate ${unit.public_unit_id}.`}
        path={`/verify/unit/${unit.public_unit_id}`}
      />

      <section className="page-header-panel">
        <p className="label">Product Verification</p>
        <h1>{verified ? 'Authenticity confirmed.' : 'Authenticity check incomplete.'}</h1>
        <p className="hero-text">
          {verified
            ? `This certificate matches an active ${siteConfig.name} registry entry and can be treated as authentic.`
            : `The scanned code does not match the active authenticity record for this unit. Please contact ${siteConfig.name} if this certificate came with your order.`}
        </p>
      </section>

      <section className="checkout-layout">
        <div className="checkout-form-panel product-auth-verify-panel">
          <div className="section-heading">
            <h2>{product?.name || `${siteConfig.name} Registered Unit`}</h2>
            <p className="hero-text">
              {product?.summary || `A registered ${siteConfig.name} certificate tied to an individual physical unit.`}
            </p>
          </div>
          <div className="product-auth-verify-grid">
            <div className="product-auth-item">
              <small>Unit ID</small>
              <strong>{unit.public_unit_id}</strong>
            </div>
            <div className="product-auth-item">
              <small>Authenticity Code</small>
              <strong>{queryCode ? 'Checked privately' : 'Missing code'}</strong>
            </div>
            <div className="product-auth-item">
              <small>Status</small>
              <strong>{verified ? 'Verified authentic' : unit.status === 'archived' ? 'Archived certificate' : 'Code mismatch'}</strong>
            </div>
            <div className="product-auth-item">
              <small>Issued Unit</small>
              <strong>Certificate #{unit.serial_number}</strong>
            </div>
          </div>
          {product ? (
            <Link to={`/products/${product.id}`} className="primary-btn">
              View Product
            </Link>
          ) : null}
        </div>

        <div className="summary-panel product-auth-qr-panel">
          <h3>Certificate QR</h3>
          <img src={qrCodeUrl} alt={`Verification QR for ${unit.public_unit_id}`} />
        </div>
      </section>
    </div>
  );
}

export default VerifyProductPage;
