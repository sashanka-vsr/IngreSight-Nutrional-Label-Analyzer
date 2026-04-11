import { useState, useEffect } from 'react';
import { getStats } from '../services/api';

const DIST_COLORS = {
  healthy:   'var(--healthy)',
  moderate:  'var(--moderate)',
  unhealthy: 'var(--unhealthy)',
  poor:      'var(--poor)',
};

const DIST_LABELS = {
  healthy:   'Healthy',
  moderate:  'Moderate',
  unhealthy: 'Unhealthy',
  poor:      'Poor',
};

function scoreColor(score) {
  if (score >= 75) return 'var(--healthy)';
  if (score >= 50) return 'var(--moderate)';
  if (score >= 25) return 'var(--unhealthy)';
  return 'var(--poor)';
}

export default function Stats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    getStats()
      .then(d => { setData(d); setTimeout(() => setAnimated(true), 100); })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page">
      <div className="loading-wrap"><div className="spinner" /><span>Loading stats…</span></div>
    </div>
  );

  if (!data || data.total === 0) return (
    <div className="page">
      <h1 className="page-title">Statistics</h1>
      <p className="page-subtitle">Insights across all analyzed products</p>
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📊</div>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No data yet</div>
        <div className="text-muted">Analyze some nutrition labels to see aggregate insights here.</div>
      </div>
    </div>
  );

  const dist = data.score_distribution || {};
  const maxDist = Math.max(...Object.values(dist), 1);

  return (
    <div className="page">
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 className="page-title">Statistics</h1>
        <p className="page-subtitle">Insights across all {data.total} analyzed products in the database</p>
      </div>

      {/* Top stat cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">Total Products</div>
          <div className="stat-card-value">{data.total}</div>
          <div className="stat-card-sub">In global catalogue</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Average Score</div>
          <div className="stat-card-value" style={{ color: scoreColor(data.avg_score) }}>
            {data.avg_score}
          </div>
          <div className="stat-card-sub">Out of 100</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Healthy Products</div>
          <div className="stat-card-value" style={{ color: 'var(--healthy)' }}>
            {dist.healthy || 0}
          </div>
          <div className="stat-card-sub">Score ≥ 75</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">To Avoid</div>
          <div className="stat-card-value" style={{ color: 'var(--poor)' }}>
            {dist.poor || 0}
          </div>
          <div className="stat-card-sub">Score &lt; 25</div>
        </div>
      </div>

      {/* Two-column lower section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>

        {/* Score distribution */}
        <div className="card">
          <div className="profile-section-title" style={{ marginBottom: '1.25rem' }}>
            Score Distribution
          </div>
          {['healthy', 'moderate', 'unhealthy', 'poor'].map(key => (
            <div className="dist-row" key={key}>
              <div className="dist-label">{DIST_LABELS[key]}</div>
              <div className="dist-bar-track">
                <div
                  className="dist-bar-fill"
                  style={{
                    width: animated ? `${((dist[key] || 0) / maxDist) * 100}%` : '0%',
                    background: DIST_COLORS[key],
                    transition: 'width 1s ease',
                  }}
                />
              </div>
              <div className="dist-count">{dist[key] || 0}</div>
            </div>
          ))}
        </div>

        {/* Top 5 healthiest */}
        <div className="card">
          <div className="profile-section-title" style={{ marginBottom: '1.25rem' }}>
            Top 5 Healthiest Products
          </div>
          {(data.top_products || []).length === 0 ? (
            <div className="text-muted">No data yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {data.top_products.map((p, i) => (
                <div key={p.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.6rem 0',
                  borderBottom: i < data.top_products.length - 1 ? '1px solid var(--border-default)' : 'none',
                }}>
                  <div style={{
                    width: 28, height: 28,
                    borderRadius: '50%',
                    background: 'var(--accent-glow)',
                    border: '1px solid var(--border-hover)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--accent)',
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.product_name}
                    </div>
                    {p.brand && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.brand}</div>}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: scoreColor(p.health_score), flexShrink: 0 }}>
                    {p.health_score}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}