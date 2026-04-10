import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UploadBox from '../components/UploadBox';
import ScoreCard from '../components/ScoreCard';
import NutritionTable from '../components/NutritionTable';
import { analyzeLabel, storeProduct, getStats } from '../services/api';

const STEPS = [
  'Reading nutrition label…',
  'Extracting nutrient data…',
  'Computing health score…',
  'Generating insights…',
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [stepsCompleted, setStepsCompleted] = useState([]);
  const [totalProducts, setTotalProducts] = useState(null);

  // Manual name entry
  const [showManualInput, setShowManualInput] = useState(false);
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [pendingData, setPendingData] = useState(null);
  const [savingName, setSavingName] = useState(false);

  const [currentFile, setCurrentFile] = useState(null);

  useEffect(() => {
    getStats().then(s => setTotalProducts(s.total)).catch(() => {});
  }, []);

  // Step cycling during analysis
  useEffect(() => {
    if (!isLoading) {
      setStepIdx(0);
      setStepsCompleted([]);
      return;
    }
    const iv = setInterval(() => {
      setStepIdx(prev => {
        const next = Math.min(prev + 1, STEPS.length - 1);
        setStepsCompleted(c => [...c, prev]);
        return next;
      });
    }, 2000);
    return () => clearInterval(iv);
  }, [isLoading]);

  const handleAnalyze = async (file, forceNew = false) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setShowManualInput(false);
    setPendingData(null);
    setProductName('');
    setBrand('');
    setCurrentFile(file);

    try {
      const response = await analyzeLabel(file, forceNew);

      if (response.status === 'existing') {
        setResult({ ...response.data, _isExisting: true });
      } else if (response.status === 'needs_name') {
        setResult(response.data);
        setPendingData(response.data);
        setProductName(response.data.product_name || '');
        setBrand(response.data.brand || '');
        setShowManualInput(true);
      } else {
        setResult(response.data);
        setShowManualInput(false);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceNew = () => {
    if (currentFile) handleAnalyze(currentFile, true);
  };

  const handleManualSave = async () => {
    if (!productName.trim()) return;
    setSavingName(true);
    try {
      const response = await storeProduct(pendingData, productName.trim(), brand.trim());
      setResult(response.data);
      setPendingData(null);
      setShowManualInput(false);
    } catch (err) {
      setError(err.message || 'Failed to save product name.');
    } finally {
      setSavingName(false);
    }
  };

  const handleScanAnother = () => {
    setResult(null);
    setError(null);
    setShowManualInput(false);
    setPendingData(null);
    setProductName('');
    setBrand('');
    setCurrentFile(null);
  };

  return (
    <>
      {/* ── Hero — always visible ─────────────────────────── */}
      <section className="home-hero">
        <div className="hero-bg" />
        <div className="hero-glow" />

        <div className="hero-badge">
          <span>✨</span> Powered by Gemini 2.5 Flash Vision
        </div>

        <h1 className="hero-title">
          Know What's<br />
          <span>Really Inside</span> Your Food
        </h1>

        <p className="hero-subtitle">
          Upload any packaged food nutrition label and get an instant AI-powered health score,
          nutrient breakdown, and personalized consumption advice.
        </p>

        {!user && (
          <button
            className="btn btn-outline"
            onClick={() => navigate('/auth')}
            style={{ margin: '0 auto', display: 'inline-flex' }}
          >
            Sign up to track your history →
          </button>
        )}

        {totalProducts !== null && (
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">{totalProducts}+</div>
              <div className="hero-stat-label">Products Analyzed</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">6</div>
              <div className="hero-stat-label">Nutrients Scored</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">100%</div>
              <div className="hero-stat-label">Transparent Scoring</div>
            </div>
          </div>
        )}
      </section>

      {/* ── Content area — swaps between upload / loading / results ── */}
      <div className="home-main">

        {/* ── STATE 1: Upload box ───────────────────────────── */}
        {!isLoading && !result && (
          <div className="upload-section">
            <UploadBox onUpload={handleAnalyze} disabled={false} />
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '0.9rem 1rem',
                color: 'var(--unhealthy)',
                fontSize: '0.9rem',
                marginTop: '1rem',
                textAlign: 'center',
              }}>
                ❌ {error}
              </div>
            )}
          </div>
        )}

        {/* ── STATE 2: Analyzing checklist ─────────────────── */}
        {isLoading && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xl)',
            padding: '2.5rem 2rem',
            textAlign: 'center',
          }}>
            <div className="spinner" style={{ margin: '0 auto 1.25rem' }} />
            <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
              Analyzing your label…
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 320, margin: '0 auto' }}>
              {STEPS.map((step, i) => {
                const isDone = stepsCompleted.includes(i);
                const isActive = stepIdx === i && !isDone;
                return (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.6rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: isDone
                      ? 'rgba(16,185,129,0.08)'
                      : isActive
                        ? 'var(--accent-glow)'
                        : 'transparent',
                    border: `1px solid ${isDone ? 'rgba(16,185,129,0.2)' : isActive ? 'var(--border-hover)' : 'transparent'}`,
                    transition: 'all 0.3s ease',
                  }}>
                    <span style={{
                      width: 22, height: 22,
                      borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      flexShrink: 0,
                      background: isDone ? 'var(--healthy)' : isActive ? 'var(--accent)' : 'var(--bg-input)',
                      color: isDone || isActive ? '#fff' : 'var(--text-muted)',
                      border: `1px solid ${isDone ? 'var(--healthy)' : isActive ? 'var(--accent)' : 'var(--border-default)'}`,
                    }}>
                      {isDone ? '✓' : i + 1}
                    </span>
                    <span style={{
                      fontSize: '0.88rem',
                      color: isDone ? 'var(--healthy)' : isActive ? 'var(--accent)' : 'var(--text-muted)',
                      fontWeight: isActive ? 600 : 400,
                    }}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STATE 3: Results ──────────────────────────────── */}
        {result && !isLoading && (
          <div>
            {/* Top bar */}
            <div className="flex-between mb-2">
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Analysis Complete
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {result._isExisting ? '⚡ Returned from database cache' : '✨ Fresh analysis'}
                </p>
              </div>
              <button className="btn btn-outline btn-sm" onClick={handleScanAnother}>
                ← Scan Another
              </button>
            </div>

            {/* Manual name entry */}
            {showManualInput && (
              <div className="card" style={{
                marginBottom: '1.25rem',
                border: '1px solid var(--border-hover)',
                background: 'var(--accent-glow)',
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  🏷️ Product name not detected
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.1rem' }}>
                  Score and insights are ready. Enter the product name to save it, or skip for a temporary analysis.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Product Name *</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g. Classic Salted Chips"
                      value={productName}
                      onChange={e => setProductName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleManualSave()}
                      autoFocus
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Brand Name</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g. Lays"
                      value={brand}
                      onChange={e => setBrand(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleManualSave()}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowManualInput(false)}>
                    Skip — keep as temporary
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ width: 'auto' }}
                    onClick={handleManualSave}
                    disabled={!productName.trim() || savingName}
                  >
                    {savingName ? 'Saving…' : 'Save to Database'}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '0.8rem 1rem',
                color: 'var(--unhealthy)',
                fontSize: '0.88rem',
                marginBottom: '1rem',
              }}>
                ❌ {error}
              </div>
            )}

            <ScoreCard product={result} onForceNew={handleForceNew} />
            <NutritionTable product={result} />

            {!user && (
              <div style={{
                background: 'var(--accent-glow)',
                border: '1px solid var(--border-hover)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
                marginTop: '1rem',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    Save your scan history
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Sign in to keep track of every product you analyze.
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" style={{ width: 'auto' }} onClick={() => navigate('/auth')}>
                  Sign up free
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
}