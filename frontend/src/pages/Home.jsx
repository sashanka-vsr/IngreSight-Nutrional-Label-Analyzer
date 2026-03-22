import { useState } from "react";
import { NavLink, Link } from 'react-router-dom'
import UploadBox from "../components/UploadBox.jsx";
import ScoreCard from "../components/ScoreCard.jsx";
import NutritionTable from "../components/NutritionTable.jsx";
import { analyzeLabel } from "../services/api.js";

function Home({ toggleTheme, theme }) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);

  const handleAnalyze = async (file, forceNew = false) => {
    setIsLoading(true);
    setError(null);
    setCurrentFile(file);
    setResult(null);

    try {
      const response = await analyzeLabel(file, forceNew);

      if (response.status === "existing") {
        setResult({ ...response.data, _isExisting: true });
        setShowManualInput(false);
      } else {
        setResult(response.data);
        if (!response.data.product_name || !response.data.brand) {
          setShowManualInput(true);
          if (response.data.product_name)
            setProductName(response.data.product_name);
          if (response.data.brand) setBrand(response.data.brand);
        } else {
          setShowManualInput(false);
        }
      }
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceNew = () => {
    if (currentFile) handleAnalyze(currentFile, true);
  };

  const handleManualSave = async () => {
    if (!result?._id) return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/history/${result._id}/update-name`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_name: productName, brand: brand }),
        },
      );
      if (response.ok) {
        setResult((prev) => ({
          ...prev,
          product_name: productName,
          brand: brand,
        }));
        setShowManualInput(false);
      }
    } catch (err) {
      console.error("Failed to update product name", err);
    }
  };

  const handleScanAnother = () => {
    setResult(null);
    setError(null);
    setShowManualInput(false);
    setProductName("");
    setBrand("");
    setCurrentFile(null);
  };

  return (
    <div className="home-container">
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

      {!result && !isLoading && (
        <div className="hero-section">
          <h1 className="hero-title">
            Know What You <span className="gradient-text">Eat</span>
          </h1>
          <p className="hero-subtitle">
            Upload a nutrition label and get an instant AI-powered health
            analysis with consumption recommendations
          </p>
        </div>
      )}

      <div className="main-content">
        {!result && !isLoading && (
          <div className="upload-section">
            <UploadBox onAnalyze={handleAnalyze} isLoading={isLoading} />
            {error && <div className="error-banner">❌ {error}</div>}
          </div>
        )}

        {isLoading && (
          <div className="analyzing-state">
            <div className="analyzing-spinner"></div>
            <h3>Analyzing your label...</h3>
            <p>Our AI is reading the nutrition data and generating insights</p>
          </div>
        )}

        {result && !isLoading && (
          <div className="results-wrapper">
            <div className="results-top-bar">
              <div className="results-top-left">
                <h2 className="results-heading">Analysis Complete</h2>
                <p className="results-subheading">Here's what we found</p>
              </div>
              <button className="btn-secondary" onClick={handleScanAnother}>
                ← Scan Another
              </button>
            </div>

            {showManualInput && (
              <div className="manual-input-card">
                <h4>🏷️ Couldn't detect product details. Want to add them?</h4>
                <div className="manual-input-fields">
                  <input
                    type="text"
                    placeholder="Product name (e.g. Classic Salted Chips)"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="manual-input"
                  />
                  <input
                    type="text"
                    placeholder="Brand name (e.g. Lays)"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="manual-input"
                  />
                </div>
                <div className="manual-input-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => setShowManualInput(false)}
                  >
                    Skip
                  </button>
                  <button className="btn-primary" onClick={handleManualSave}>
                    Save Details
                  </button>
                </div>
              </div>
            )}

            <div className="results-grid">
              <div className="results-left">
                <ScoreCard data={result} onForceNew={handleForceNew} />
              </div>
              <div className="results-right">
                <NutritionTable
                  nutrition={result.nutrition}
                  scoreBreakdown={result.score_breakdown}
                />
              </div>
            </div>
          </div>
        )}
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

export default Home;
