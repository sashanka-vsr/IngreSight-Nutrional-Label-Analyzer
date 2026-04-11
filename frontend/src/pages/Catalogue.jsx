import { useState, useEffect, useRef } from 'react';
import { getCatalogue, getProduct_public } from '../services/api';
import ScoreCard from '../components/ScoreCard';
import NutritionTable from '../components/NutritionTable';

function scoreStyle(score) {
  if (score >= 75) return { bg: 'rgba(16,185,129,0.15)', color: 'var(--healthy)' };
  if (score >= 50) return { bg: 'rgba(245,158,11,0.12)', color: 'var(--moderate)' };
  if (score >= 25) return { bg: 'rgba(239,68,68,0.1)',   color: 'var(--unhealthy)' };
  return             { bg: 'rgba(220,38,38,0.1)',         color: 'var(--poor)' };
}

function groupByLetter(products) {
  const groups = {};
  for (const p of products) {
    const first = (p.product_name?.[0] || '#').toUpperCase();
    const key = /[A-Z]/.test(first) ? first : '#';
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

export default function Catalogue() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const debounceRef = useRef();

  // Modal state
  const [modalProduct, setModalProduct] = useState(null);   // full product data
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const load = async (q = '') => {
    setLoading(true);
    try {
      const data = await getCatalogue(q);
      setProducts(data.products);
      setTotal(data.total);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(val), 300);
  };

  // ── Open product detail modal ──────────────────────────────────────────────
  const handleItemClick = async (item) => {
    setModalProduct(null);
    setModalError('');
    setModalLoading(true);

    // Open modal immediately with basic info while full data loads
    setModalProduct({ ...item, _loading: true });

    try {
      const full = await getProduct_public(item.id);
      setModalProduct(full);
    } catch {
      setModalError('Could not load product details.');
      setModalProduct({ ...item, _loading: false });
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalProduct(null);
    setModalError('');
  };

  const grouped = groupByLetter(products);

  return (
    <div className="page">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Catalogue</h1>
        <p className="page-subtitle">
          {total > 0
            ? `${total} product${total !== 1 ? 's' : ''} in the global database — sorted A–Z`
            : 'Browse all analyzed products'}
        </p>
      </div>

      {/* Search */}
      <div className="catalogue-search-wrap">
        <span className="catalogue-search-icon">🔍</span>
        <input
          className="catalogue-search"
          type="text"
          placeholder="Search by product name…"
          value={search}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="loading-wrap"><div className="spinner" /><span>Loading catalogue…</span></div>
      ) : products.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🍽️</div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            {search ? 'No products match your search' : 'No products yet'}
          </div>
          <div className="text-muted">
            {search
              ? 'Try a different keyword.'
              : 'Scan a nutrition label from the home page to get started.'}
          </div>
        </div>
      ) : (
        grouped.map(([letter, items]) => (
          <div className="catalogue-letter-group" key={letter}>
            <div className="catalogue-letter-header">{letter}</div>
            {items.map(p => {
              const { bg, color } = scoreStyle(p.health_score);
              return (
                <div
                  key={p.id}
                  className="catalogue-item"
                  onClick={() => handleItemClick(p)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && handleItemClick(p)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="catalogue-item-score" style={{ background: bg, color }}>
                    {p.health_score}
                  </div>
                  <div className="catalogue-item-info">
                    <div className="catalogue-item-name">{p.product_name}</div>
                    {p.brand && <div className="catalogue-item-brand">{p.brand}</div>}
                  </div>
                  <div className="catalogue-item-right">
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color }}>{p.score_label}</div>
                    {p.frequency && <div className="catalogue-item-freq">{p.frequency}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        ))
      )}

      {/* ── Product Detail Modal ──────────────────────────────────────────── */}
      {modalProduct && (
        <div
          className="modal-overlay"
          onClick={closeModal}
          style={{ alignItems: 'flex-start', paddingTop: '4rem', overflowY: 'auto' }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-xl)',
              width: '100%',
              maxWidth: 720,
              maxHeight: '82vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-default)',
              position: 'sticky',
              top: 0,
              background: 'var(--bg-card)',
              zIndex: 1,
              borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  {modalProduct.product_name || 'Product Detail'}
                </div>
                {modalProduct.brand && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {modalProduct.brand}
                  </div>
                )}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={closeModal}
                style={{ fontSize: '1.1rem', padding: '0.3rem 0.6rem' }}
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '1.25rem 1.5rem 1.5rem' }}>
              {modalLoading && modalProduct._loading ? (
                <div className="loading-wrap" style={{ padding: '2rem' }}>
                  <div className="spinner" />
                  <span>Loading full details…</span>
                </div>
              ) : modalError ? (
                <div style={{ color: 'var(--unhealthy)', fontSize: '0.9rem', padding: '1rem' }}>
                  {modalError}
                </div>
              ) : (
                <>
                  <ScoreCard product={modalProduct} />
                  <NutritionTable product={modalProduct} />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}