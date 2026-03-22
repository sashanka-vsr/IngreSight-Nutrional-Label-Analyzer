import { useState, useEffect } from "react";
import { NavLink, Link } from 'react-router-dom'
import { getHistory } from "../services/api.js";

function Stats({ toggleTheme, theme }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await getHistory(100, 0);
      const products = response.data;
      const total = response.total;

      if (products.length === 0) {
        setStats(null);
        setLoading(false);
        return;
      }

      const avgScore = Math.round(
        products.reduce((sum, p) => sum + p.health_score, 0) / products.length,
      );

      const healthy = products.filter((p) => p.health_score >= 75).length;
      const moderate = products.filter(
        (p) => p.health_score >= 50 && p.health_score < 75,
      ).length;
      const unhealthy = products.filter(
        (p) => p.health_score >= 25 && p.health_score < 50,
      ).length;
      const poor = products.filter((p) => p.health_score < 25).length;

      const frequencyCount = {};
      products.forEach((p) => {
        const freq = p.insights?.consumption_frequency;
        if (freq) frequencyCount[freq] = (frequencyCount[freq] || 0) + 1;
      });

      const topFrequency = Object.entries(frequencyCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);

      const sorted = [...products].sort(
        (a, b) => b.health_score - a.health_score,
      );
      const topProducts = sorted.slice(0, 3);
      const bottomProducts = sorted.slice(-3).reverse();

      setStats({
        total,
        avgScore,
        healthy,
        moderate,
        unhealthy,
        poor,
        topFrequency,
        topProducts,
        bottomProducts,
      });
    } catch (err) {
      setError("Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return "#22c55e";
    if (score >= 50) return "#eab308";
    if (score >= 25) return "#f97316";
    return "#ef4444";
  };

  const getScoreLabel = (score) => {
    if (score >= 75) return "Healthy";
    if (score >= 50) return "Moderate";
    if (score >= 25) return "Unhealthy";
    return "Poor";
  };

  return (
    <div className="stats-page">
     <nav className="navbar">
  <div className="navbar-brand">
    <span className="navbar-logo">🥗</span>
    <span className="navbar-title">IngreSight</span>
  </div>
  <div className="navbar-links">
    <NavLink to="/" end className={({ isActive }) => isActive ? 'navbar-link active-link' : 'navbar-link'}>Home</NavLink>
    <NavLink to="/about" className={({ isActive }) => isActive ? 'navbar-link active-link' : 'navbar-link'}>About</NavLink>
    <NavLink to="/stats" className={({ isActive }) => isActive ? 'navbar-link active-link' : 'navbar-link'}>Stats</NavLink>
    <NavLink to="/history" className={({ isActive }) => isActive ? 'navbar-link active-link' : 'navbar-link'}>History</NavLink>
    <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  </div>
</nav>

      <div className="stats-content">
        <div className="about-hero">
          <h1 className="hero-title">
            Your <span className="gradient-text">Stats</span>
          </h1>
          <p className="hero-subtitle">
            Aggregate insights from all your scanned products
          </p>
        </div>

        {loading && (
          <div className="history-loading">
            <div className="spinner-large"></div>
            <p>Loading stats...</p>
          </div>
        )}

        {error && (
          <div className="history-error">
            <p>{error}</p>
            <button className="btn-secondary" onClick={fetchStats}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && !stats && (
          <div className="history-empty">
            <span className="empty-icon">📊</span>
            <h3>No data yet</h3>
            <p>Scan some products first to see your stats</p>
            <Link
              to="/"
              className="btn-primary"
              style={{ marginTop: "1rem", display: "inline-flex" }}
            >
              Start Scanning
            </Link>
          </div>
        )}

        {!loading && !error && stats && (
          <div className="stats-grid-wrapper">
            <div className="stats-top-row">
              <div className="stat-card">
                <p className="stat-label">Total Scanned</p>
                <p className="stat-number">{stats.total}</p>
                <p className="stat-sublabel">products</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Average Score</p>
                <p
                  className="stat-number"
                  style={{ color: getScoreColor(stats.avgScore) }}
                >
                  {stats.avgScore}
                </p>
                <p className="stat-sublabel">/100</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Healthiest</p>
                <p className="stat-number" style={{ color: "#22c55e" }}>
                  {stats.healthy}
                </p>
                <p className="stat-sublabel">products ≥ 75</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Avoid</p>
                <p className="stat-number" style={{ color: "#ef4444" }}>
                  {stats.poor}
                </p>
                <p className="stat-sublabel">scored below 25</p>
              </div>
            </div>

            <div className="stats-middle-row">
              <div className="stats-section-card">
                <h3 className="stats-section-title">Score Distribution</h3>
                <div className="distribution-list">
                  {[
                    {
                      label: "Healthy",
                      count: stats.healthy,
                      color: "#22c55e",
                    },
                    {
                      label: "Moderate",
                      count: stats.moderate,
                      color: "#eab308",
                    },
                    {
                      label: "Unhealthy",
                      count: stats.unhealthy,
                      color: "#f97316",
                    },
                    { label: "Poor", count: stats.poor, color: "#ef4444" },
                  ].map((item, i) => (
                    <div key={i} className="distribution-row">
                      <span
                        className="distribution-label"
                        style={{ color: item.color }}
                      >
                        {item.label}
                      </span>
                      <div className="distribution-bar-track">
                        <div
                          className="distribution-bar-fill"
                          style={{
                            width:
                              stats.total > 0
                                ? `${(item.count / stats.total) * 100}%`
                                : "0%",
                            background: item.color,
                          }}
                        />
                      </div>
                      <span className="distribution-count">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {stats.topFrequency.length > 0 && (
                <div className="stats-section-card">
                  <h3 className="stats-section-title">Consumption Frequency</h3>
                  <div className="frequency-stats-list">
                    {stats.topFrequency.map(([freq, count], i) => (
                      <div key={i} className="frequency-stat-row">
                        <span className="frequency-stat-label">{freq}</span>
                        <span className="frequency-stat-count">
                          {count} products
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="stats-bottom-row">
              <div className="stats-section-card">
                <h3 className="stats-section-title">🏆 Healthiest Products</h3>
                <div className="product-rank-list">
                  {stats.topProducts.map((p, i) => (
                    <div key={i} className="product-rank-row">
                      <span className="rank-number">#{i + 1}</span>
                      <span className="rank-name">
                        {p.product_name || "Unknown Product"}
                      </span>
                      <span
                        className="rank-score"
                        style={{ color: getScoreColor(p.health_score) }}
                      >
                        {p.health_score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="stats-section-card">
                <h3 className="stats-section-title">⚠️ Needs Attention</h3>
                <div className="product-rank-list">
                  {stats.bottomProducts.map((p, i) => (
                    <div key={i} className="product-rank-row">
                      <span className="rank-number">#{i + 1}</span>
                      <span className="rank-name">
                        {p.product_name || "Unknown Product"}
                      </span>
                      <span
                        className="rank-score"
                        style={{ color: getScoreColor(p.health_score) }}
                      >
                        {p.health_score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="footer">
        <p>IngreSight — AI Nutritional Label Analyzer</p>
        <p className="footer-sub">Stats based on your scanned products</p>
      </footer>
    </div>
  );
}

export default Stats;
