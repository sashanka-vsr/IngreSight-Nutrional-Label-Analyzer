import { useState } from "react";
import { NavLink, Link } from 'react-router-dom'
import ProductHistory from "../components/ProductHistory.jsx";
import ScoreCard from "../components/ScoreCard.jsx";
import NutritionTable from "../components/NutritionTable.jsx";
import { getProductById } from "../services/api.js";

function History({ toggleTheme, theme }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState(null);

  const handleSelectProduct = async (product) => {
    try {
      setLoadingDetail(true);
      setError(null);
      const response = await getProductById(product._id);
      setSelectedProduct(response.data);
    } catch (err) {
      setError("Failed to load product details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleClose = () => {
    setSelectedProduct(null);
    setError(null);
  };

  return (
    <div className="history-page">
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
      <div className="history-page-content">
        <div className="history-page-header">
          <h1 className="history-page-title">
            Product <span className="gradient-text">History</span>
          </h1>
          <p className="history-page-subtitle">
            All your previously analyzed nutrition labels
          </p>
        </div>

        <div className="history-layout">
          <div className="history-list-panel">
            <ProductHistory onSelectProduct={handleSelectProduct} />
          </div>

          <div className="history-detail-panel">
            {!selectedProduct && !loadingDetail && !error && (
              <div className="detail-placeholder">
                <div className="placeholder-icon">👈</div>
                <h3>Select a product</h3>
                <p>Click any product from the list to view its full analysis</p>
              </div>
            )}

            {loadingDetail && (
              <div className="detail-loading">
                <div className="spinner-large"></div>
                <p>Loading details...</p>
              </div>
            )}

            {error && (
              <div className="detail-error">
                <p>{error}</p>
                <button className="btn-secondary" onClick={handleClose}>
                  Close
                </button>
              </div>
            )}

            {selectedProduct && !loadingDetail && (
              <div className="detail-content">
                <button className="close-detail-btn" onClick={handleClose}>
                  ✕ Close
                </button>
                <ScoreCard data={selectedProduct} onForceNew={null} />
                <NutritionTable
                  nutrition={selectedProduct.nutrition}
                  scoreBreakdown={selectedProduct.score_breakdown}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>IngreSight — AI Nutritional Label Analyzer</p>
        <p className="footer-sub">
          Scores are based on per-serving values and general health guidelines
        </p>
      </footer>
    </div>
  );
}

export default History;
