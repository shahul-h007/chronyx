import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowClockwise,
  Eye,
  MagnifyingGlass,
  Package,
  PencilSimple,
  Plus,
  Trash,
  WarningCircle,
} from '@phosphor-icons/react';
import { supabase } from '../lib/supabase';
import { buildPublicProductId } from '../lib/productIdentity';
import {
  AdminPageHeader,
  StatCard,
  StatusBadge,
  EmptyState,
  ConfirmDialog,
} from '../components/common';
import { formatCurrency } from '../config/adminConfig';

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*, product_images(image_url, is_hero, sort_order)')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err.message);
      setError('Unable to load products. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      setIsDeleting(true);
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id);

      if (deleteError) throw deleteError;
      setProducts((current) => current.filter((product) => product.id !== productToDelete.id));
      setProductToDelete(null);
    } catch (err) {
      console.error('Error deleting product:', err.message);
      setError(`Failed to delete "${productToDelete.name}": ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const stats = useMemo(() => {
    const live = products.filter((product) => product.is_live).length;
    const draft = products.length - live;
    const lowStock = products.filter((product) => Number(product.stock_quantity || 0) <= 5).length;
    return { live, draft, lowStock };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (filter === 'live' && !product.is_live) return false;
      if (filter === 'draft' && product.is_live) return false;
      if (filter === 'low_stock' && Number(product.stock_quantity || 0) > 5) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const name = (product.name || '').toLowerCase();
        const category = (product.category || '').toLowerCase();
        const sku = buildPublicProductId(product.id).toLowerCase();
        return name.includes(q) || category.includes(q) || sku.includes(q);
      }

      return true;
    });
  }, [products, filter, search]);

  const getHeroImage = (product) => {
    const images = [...(product.product_images || [])].sort(
      (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
    );
    return images.find((image) => image.is_hero)?.image_url || images[0]?.image_url || '';
  };

  const renderStockBadge = (stockQuantity) => {
    const stock = Number(stockQuantity || 0);
    if (stock === 0) {
      return <StatusBadge status="danger">0 in stock (Out of stock)</StatusBadge>;
    }
    if (stock <= 5) {
      return <StatusBadge status="warning">{stock} left (Low stock)</StatusBadge>;
    }
    return <span className="catalog-stock-quiet">{stock} in stock</span>;
  };

  return (
    <div className="catalog-page">
      <AdminPageHeader
        eyebrow="Commerce"
        title="Products"
        description="Manage storefront inventory, monitor stock health, and update product pricing and visibility."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={fetchProducts}
              disabled={loading}
              title="Refresh product list"
            >
              <ArrowClockwise size={16} className={loading ? 'spin-icon' : ''} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              className="btn-primary catalog-create-btn"
              onClick={() => navigate('/products/new')}
            >
              <Plus size={16} />
              <span>Add Product</span>
            </button>
          </div>
        }
      />

      {error && (
        <div className="catalog-error-banner" role="alert">
          <div className="catalog-error-content">
            <WarningCircle size={20} />
            <span>{error}</span>
          </div>
          <button type="button" className="btn-secondary btn-sm" onClick={fetchProducts}>
            Retry
          </button>
        </div>
      )}

      {/* Catalog KPI Statistics */}
      <section className="catalog-stat-grid" aria-label="Catalog Summary">
        <StatCard
          label="Total Products"
          value={products.length}
          description="Items registered in catalog"
          icon={Package}
          tone="neutral"
        />
        <StatCard
          label="Live on Store"
          value={stats.live}
          description="Publicly visible on storefront"
          icon={Eye}
          tone="success"
        />
        <StatCard
          label="Draft Items"
          value={stats.draft}
          description="Hidden from storefront"
          icon={PencilSimple}
          tone="neutral"
        />
        <StatCard
          label="Low Stock"
          value={stats.lowStock}
          description="5 or fewer units remaining"
          icon={WarningCircle}
          tone={stats.lowStock > 0 ? 'warning' : 'neutral'}
        />
      </section>

      {/* Search and Filters Toolbar */}
      <div className="catalog-toolbar">
        <div className="catalog-search-wrap">
          <MagnifyingGlass size={16} />
          <input
            type="text"
            placeholder="Search by name, category, or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search products"
          />
        </div>
        <div className="catalog-filter-group" role="tablist" aria-label="Filter products">
          <button
            type="button"
            className={`catalog-filter-chip ${filter === 'all' ? 'is-active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({products.length})
          </button>
          <button
            type="button"
            className={`catalog-filter-chip ${filter === 'live' ? 'is-active' : ''}`}
            onClick={() => setFilter('live')}
          >
            Live ({stats.live})
          </button>
          <button
            type="button"
            className={`catalog-filter-chip ${filter === 'draft' ? 'is-active' : ''}`}
            onClick={() => setFilter('draft')}
          >
            Draft ({stats.draft})
          </button>
          <button
            type="button"
            className={`catalog-filter-chip ${filter === 'low_stock' ? 'is-active' : ''}`}
            onClick={() => setFilter('low_stock')}
          >
            Low Stock ({stats.lowStock})
          </button>
        </div>
      </div>

      {/* Product List / Table Container */}
      <div className="card catalog-table-card">
        {loading && products.length === 0 ? (
          <div className="catalog-loading-state">
            <ArrowClockwise size={28} className="spin-icon" />
            <p>Loading products catalog...</p>
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products yet"
            description="Your store catalog is currently empty. Click 'Add Product' to create your first item."
            action={
              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate('/products/new')}
              >
                <Plus size={16} />
                <span>Add Product</span>
              </button>
            }
          />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={MagnifyingGlass}
            title="No matching products"
            description="No products match your current search or filter criteria."
            action={
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSearch('');
                  setFilter('all');
                }}
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <>
            {/* Desktop & Tablet Table View */}
            <div className="catalog-table-wrap catalog-desktop-table">
              <table className="catalog-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th className="catalog-th-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const heroImage = getHeroImage(product);
                    const sku = buildPublicProductId(product.id);

                    return (
                      <tr key={product.id}>
                        <td>
                          <div className="catalog-product-cell">
                            <div className="catalog-product-thumb">
                              {heroImage ? (
                                <img src={heroImage} alt={product.name} />
                              ) : (
                                <div className="catalog-product-thumb-empty">
                                  <Package size={20} />
                                </div>
                              )}
                            </div>
                            <div className="catalog-product-info">
                              <span className="catalog-product-title">{product.name}</span>
                              <div className="catalog-product-sub">
                                <span className="catalog-product-id">{sku}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="catalog-category-cell">
                          {product.category || 'Uncategorized'}
                        </td>
                        <td className="catalog-price-cell">
                          {formatCurrency(product.price)}
                        </td>
                        <td>{renderStockBadge(product.stock_quantity)}</td>
                        <td>
                          {product.is_live ? (
                            <StatusBadge status="success">Live</StatusBadge>
                          ) : (
                            <StatusBadge status="neutral">Draft</StatusBadge>
                          )}
                        </td>
                        <td className="catalog-actions-cell">
                          <div className="catalog-actions">
                            <button
                              type="button"
                              className="btn-secondary btn-sm"
                              onClick={() => navigate(`/products/${product.id}`)}
                            >
                              <PencilSimple size={15} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              className="btn-secondary btn-sm catalog-delete-btn"
                              onClick={() => setProductToDelete(product)}
                              title="Delete product"
                            >
                              <Trash size={15} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="catalog-mobile-list" style={{ padding: '16px' }}>
              {filteredProducts.map((product) => {
                const heroImage = getHeroImage(product);
                const sku = buildPublicProductId(product.id);

                return (
                  <article key={product.id} className="catalog-mobile-card">
                    <div className="catalog-mobile-top">
                      <div className="catalog-mobile-thumb">
                        {heroImage ? (
                          <img src={heroImage} alt={product.name} />
                        ) : (
                          <div className="catalog-mobile-thumb-empty">
                            <Package size={20} />
                          </div>
                        )}
                      </div>
                      <div className="catalog-mobile-info">
                        <h4>{product.name}</h4>
                        <span className="catalog-product-id">{sku}</span>
                      </div>
                    </div>

                    <div className="catalog-mobile-meta-grid">
                      <div className="catalog-mobile-meta-item">
                        <small>Price</small>
                        <strong>{formatCurrency(product.price)}</strong>
                      </div>
                      <div className="catalog-mobile-meta-item">
                        <small>Category</small>
                        <strong>{product.category || 'Uncategorized'}</strong>
                      </div>
                      <div className="catalog-mobile-meta-item">
                        <small>Stock</small>
                        <div>{renderStockBadge(product.stock_quantity)}</div>
                      </div>
                      <div className="catalog-mobile-meta-item">
                        <small>Status</small>
                        <div>
                          {product.is_live ? (
                            <StatusBadge status="success">Live</StatusBadge>
                          ) : (
                            <StatusBadge status="neutral">Draft</StatusBadge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="catalog-mobile-actions">
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => navigate(`/products/${product.id}`)}
                      >
                        <PencilSimple size={15} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        className="btn-secondary btn-sm catalog-delete-btn"
                        onClick={() => setProductToDelete(product)}
                      >
                        <Trash size={15} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(productToDelete)}
        title="Delete Product"
        message={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete Product"
        danger
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
};

export default Products;
