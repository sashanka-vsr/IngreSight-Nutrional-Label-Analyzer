import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UploadBox from '../components/UploadBox';
import ScoreCard from '../components/ScoreCard';
import NutritionTable from '../components/NutritionTable';
import { analyzeLabel, getStats } from '../services/api';

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
  const [loadingVision, setLoadingVision] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [stepsCompleted, setStepsCompleted] = useState([]);
  const [totalProducts, setTotalProducts] = useState(null);

  const [formProductName, setFormProductName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [currentFile, setCurrentFile] = useState(null);
  const [lookupMiss, setLookupMiss] = useState(false);
  const [lookupMessage, setLookupMessage] = useState('');

  useEffect(() => {
    getStats().then(s => setTotalProducts(s.total)).catch(() => {});
  }, []);

  useEffect(() => {
    const active = isLoading && loadingVision;
    if (!active) {
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
  }, [isLoading, loadingVision]);

  const apiOpts = () => ({
    userProductName: formProductName.trim(),
    userBrand: formBrand.trim(),
  });

  const handleFile = async (file) => {
    setError(null);
    setResult(null);
    setLookupMiss(false);
    setLookupMessage('');
    if (!formProductName.trim()) {
      setError('Enter the product name first. We check the database before using any AI quota.');
      return;
    }
    setCurrentFile(file);
    setIsLoading(true);
    setLoadingVision(false);
    try {
      const response = await analyzeLabel(file, { phase: 'lookup', forceNew: false, ...apiOpts() });
      if (response.status === 'existing') {
        setResult({
          ...response.data,
          _isExisting: true,
          _warning: response.warning || null,
          _matchReason: response.match_reason || null,
        });
      } else if (response.status === 'lookup_miss') {
        setLookupMiss(true);
        setLookupMessage(response.message || 'No cache hit. Run AI analysis when you are ready.');
      } else {
        setError(response.message || 'Unexpected response from server.');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const runVision = async (forceNew) => {
    if (!currentFile || !formProductName.trim()) {
      setError('Select an image and enter a product name.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setLoadingVision(true);
    setLookupMiss(false);
    try {
      const response = await analyzeLabel(currentFile, {
        phase: 'vision',
        forceNew,
        ...apiOpts(),
      });
      if (response.status === 'existing') {
        setResult({
          ...response.data,
          _isExisting: true,
          _warning: response.warning || null,
          _matchReason: response.match_reason || null,
        });
      } else if (response.status === 'new' || response.status === 'updated') {
        setResult({
          ...response.data,
          _isExisting: false,
          _warning: response.warning || null,
          _matchReason: null,
        });
      } else {
        setError(response.message || 'Unexpected response from server.');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingVision(false);
    }
  };

  const handleForceNew = () => {
    runVision(true);
  };

  const handleScanAnother = () => {
    setResult(null);
    setError(null);
    setLookupMiss(false);
    setLookupMessage('');
    setCurrentFile(null);
  };

  return (
    <>
      <section className="home-hero">
        <div className="hero-bg" />
        <div className="hero-glow" />

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

      <div className="home-main">

        {!isLoading && !result && (
          <div className="upload-section">
            <div className="card" style={{
              marginBottom: '1.25rem',
              padding: '1rem 1.25rem',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                Step 1 — Identify the product
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Product name *</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. Classic Salted Chips"
                    value={formProductName}
                    onChange={e => setFormProductName(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Brand (optional)</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. Lay's"
                    value={formBrand}
                    onChange={e => setFormBrand(e.target.value)}
                  />
                </div>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.65rem', marginBottom: 0 }}>
              </p>
            </div>

            <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Step 2 — Upload label photo
            </div>
            <UploadBox onUpload={handleFile} disabled={!formProductName.trim()} />

            {lookupMiss && (
              <div className="card" style={{
                marginTop: '1.25rem',
                padding: '1.1rem 1.25rem',
                border: '1px solid var(--border-hover)',
                background: 'var(--accent-glow)',
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Nothing in cache for this name / image
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  {lookupMessage} Same image uploaded again later will load from the database without a new API call.
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => runVision(false)}
                  disabled={!currentFile}
                >
                  Run AI analysis
                </button>
              </div>
            )}

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
              {loadingVision ? 'Analyzing your label with AI…' : 'Checking database…'}
            </div>
            {loadingVision && (
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
            )}
          </div>
        )}

        {result && !isLoading && (
          <div>
            <div className="flex-between mb-2">
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Analysis Complete
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {result._isExisting ? '⚡ Loaded from database ' : '✨ Fresh AI analysis'}
                  {result._isExisting && result._matchReason === 'skeleton_key' && (
                    <span> · matched similar spelling (spaces / punctuation)</span>
                  )}
                  {result._isExisting && result._matchReason === 'skeleton_key_unique' && (
                    <span> · matched unique spelling variant</span>
                  )}
                  {result._isExisting && result._matchReason === 'spelling_spacing' && (
                    <span> · matched catalogue name with different spacing</span>
                  )}
                  {result._isExisting && result._matchReason === 'exact_match' && (
                    <span> · exact name match</span>
                  )}
                </p>
              </div>
              <button className="btn btn-outline btn-sm" onClick={handleScanAnother}>
                ← Scan Another
              </button>
            </div>

            {result._warning === 'vision_name_mismatch' && (
              <div className="card" style={{
                marginBottom: '1rem',
                padding: '0.85rem 1rem',
                border: '1px solid rgba(245,158,11,0.35)',
                background: 'rgba(245,158,11,0.08)',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
              }}>
                The text on the label looks like a different product than the name you typed. Showing the database
                entry that matches what was read from the image. If that is wrong, go back and fix the product name,
                or use “Run fresh scan” if the cached row is not your product.
              </div>
            )}

            {result._isExisting && (
              <div className="card" style={{
                marginBottom: '1rem',
                padding: '0.85rem 1rem',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                border: '1px solid var(--border-hover)',
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Not your product? Run a fresh AI read on this photo (uses 1 API request).
                </span>
                <button type="button" className="btn btn-outline btn-sm" onClick={handleForceNew} disabled={!currentFile}>
                  Not your product — run fresh scan
                </button>
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

            <ScoreCard product={result} />
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
