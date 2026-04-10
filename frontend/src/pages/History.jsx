import { useState, useEffect } from 'react';
import { getHistory, removeFromHistory } from '../services/api';
import ScoreCard from '../components/ScoreCard';
import NutritionTable from '../components/NutritionTable';

function scoreColor(score) {
  if (score >= 75) return { bg: 'var(--score-bg-healthy)', color: 'var(--healthy)' };
  if (score >= 50) return { bg: 'var(--score-bg-moderate)', color: 'var(--moderate)' };
  if (score >= 25) return { bg: 'var(--score-bg-unhealthy)', color: 'var(--unhealthy)' };
  return { bg: 'var(--score-bg-poor)', color: 'var(--poor)' };
}

// Normalize product so it always has .id (string) regardless of what backend returns
function normalize(p) {
  const id = p.id || p._id || '';
  return { ...p, id: String(id) };
}

export default function History() {
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getHistory(page, 15)
      .then(data => {
        if (cancelled) return;
        const normalized = (data.products || []).map(normalize);
        setProducts(normalized);
        setPagination({ total: data.total, pages: data.pages });
        // Auto-select first only on first load
        if (normalized.length > 0) {
          setSelectedId(prev => prev ?? normalized[0].id);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page]);

  const selected = products.find(p => p.id === selectedId) || null;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleRemove = async (id) => {
    setRemoving(id);
    try {
      await removeFromHistory(id);
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      // Select next available
      if (selectedId === id) {
        setSelectedId(updated[0]?.id || null);
      }
      showToast('Removed from your history');
    } catch {
      showToast('Failed to remove');
    } finally {
      setRemoving(null);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="page">
        <div className="loading-wrap">
          <div className="spinner" />
          <span>Loading your history…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">My History</h1>
        <p className="page-subtitle">
          {pagination.total > 0
            ? `${pagination.total} product${pagination.total !== 1 ? 's' : ''} scanned by you`
            : 'Your scanned products will appear here'}
        </p>
      </div>

      {products.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No products yet
          </div>
          <div className="text-muted">Head to the home page and scan your first nutrition label.</div>
        </div>
      ) : (
        <div className="history-layout">

          {/* ── Sidebar ────────────────────────────────────── */}
          <div className="history-sidebar">
            <div className="history-sidebar-header">
              <span className="history-sidebar-title">Products</span>
              <span className="text-muted" style={{ fontSize: '0.78rem' }}>{pagination.total} total</span>
            </div>

            {products.map(p => {
              const { bg, color } = scoreColor(p.health_score);
              return (
                <div
                  key={p.id}
                  className={`history-item${selectedId === p.id ? ' selected' : ''}`}
                  onClick={() => setSelectedId(p.id)}
                >
                  <div className="history-item-score" style={{ background: bg, color }}>
                    {p.health_score}
                  </div>
                  <div className="history-item-info">
                    <div className="history-item-name">{p.product_name || 'Unknown'}</div>
                    <div className="history-item-brand">{p.brand || p.score_label || ''}</div>
                  </div>
                </div>
              );
            })}

            {pagination.pages > 1 && (
              <div className="pagination">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                <span className="text-muted" style={{ fontSize: '0.82rem' }}>{page} / {pagination.pages}</span>
                <button className="page-btn" disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}>›</button>
              </div>
            )}
          </div>

          {/* ── Detail panel ───────────────────────────────── */}
          <div>
            {selected ? (
              <>
                <div className="flex-between mb-2">
                  <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                    {selected.scanned_at
                      ? new Date(selected.scanned_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : ''}
                  </span>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemove(selected.id)}
                    disabled={removing === selected.id}
                  >
                    {removing === selected.id ? 'Removing…' : 'Remove from history'}
                  </button>
                </div>
                <ScoreCard product={selected} />
                <NutritionTable product={selected} />
              </>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                Select a product from the list to view details.
              </div>
            )}
          </div>

        </div>
      )}

      {toast && <div className="toast toast-info">{toast}</div>}
    </div>
  );
}