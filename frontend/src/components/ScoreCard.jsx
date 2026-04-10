import { useEffect, useRef, useState } from 'react';

function getScoreClass(score) {
  if (score >= 75) return 'healthy';
  if (score >= 50) return 'moderate';
  if (score >= 25) return 'unhealthy';
  return 'poor';
}

function getBarClass(score) {
  if (score >= 60) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

const LABEL_ICONS = {
  Healthy:   '🟢',
  Moderate:  '🟡',
  Unhealthy: '🟠',
  Poor:      '🔴',
};

const FREQ_ICONS = {
  'Daily':                  '✅',
  '2-3 times per week':     '📅',
  'Once a week':            '📆',
  'Once or twice a month':  '⚠️',
  'Avoid':                  '🚫',
};

export default function ScoreCard({ product }) {
  const barRef = useRef();
  const [animated, setAnimated] = useState(false);

  const score = product?.health_score ?? 0;
  const label = product?.score_label ?? '';

  // insights is a dict: { summary, consumption_frequency, frequency_reason,
  //                        positives, concerns, who_should_avoid, healthier_alternatives }
  const insights = product?.insights ?? {};
  const isInsightsDict = insights && typeof insights === 'object' && !Array.isArray(insights);

  const frequency = isInsightsDict ? (insights.consumption_frequency ?? '') : '';
  const summary = isInsightsDict ? (insights.summary ?? '') : '';
  const positives = isInsightsDict ? (insights.positives ?? []) : [];
  const concerns = isInsightsDict ? (insights.concerns ?? []) : [];
  const whoAvoid = isInsightsDict ? (insights.who_should_avoid ?? []) : [];
  const alternatives = isInsightsDict ? insights.healthier_alternatives : null;

  useEffect(() => {
    setAnimated(false);
    const t = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(t);
  }, [product?.id]);

  const scoreClass = getScoreClass(score);
  const barClass = getBarClass(score);
  const freqIcon = FREQ_ICONS[frequency] ?? '📊';
  const labelIcon = LABEL_ICONS[label] ?? '📊';

  return (
    <div className="score-card card-glow">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="score-header">
        <div>
          <div className="score-product-name">
            {product?.product_name || 'Unknown Product'}
          </div>
          {product?.brand && (
            <div className="score-brand">{product.brand}</div>
          )}
        </div>
        <span className={`score-badge ${scoreClass}`}>
          {labelIcon} {label}
        </span>
      </div>

      {/* ── Animated score bar ─────────────────────────────── */}
      <div className="score-bar-wrap">
        <div className="score-bar-header">
          <span className="score-bar-label">Health Score</span>
          <span className="score-bar-value">
            {score}<span>/100</span>
          </span>
        </div>
        <div className="score-bar-track">
          <div
            ref={barRef}
            className={`score-bar-fill ${barClass}`}
            style={{ width: animated ? `${score}%` : '0%' }}
          />
        </div>
      </div>

      {/* ── Consumption frequency ──────────────────────────── */}
      {frequency && (
        <div style={{ marginBottom: '1rem' }}>
          <span className="frequency-pill">
            {freqIcon} Recommended: <strong style={{ marginLeft: 4 }}>{frequency}</strong>
          </span>
          {insights.frequency_reason && (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.4rem', paddingLeft: '0.25rem' }}>
              {insights.frequency_reason}
            </div>
          )}
        </div>
      )}

      {/* ── Summary ────────────────────────────────────────── */}
      {summary && (
        <div className="insights-section">
          <div className="insights-title">Summary</div>
          <div className="insight-item">
            <span className="insight-icon">💡</span>
            <span>{summary}</span>
          </div>
        </div>
      )}

      {/* ── Positives ──────────────────────────────────────── */}
      {positives.length > 0 && (
        <div className="insights-section">
          <div className="insights-title">Positives</div>
          {positives.map((item, i) => (
            <div className="insight-item" key={i}>
              <span className="insight-icon">✅</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Concerns ───────────────────────────────────────── */}
      {concerns.length > 0 && (
        <div className="insights-section">
          <div className="insights-title">Concerns</div>
          {concerns.map((item, i) => (
            <div className="insight-item" key={i}>
              <span className="insight-icon">⚠️</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Who should avoid ───────────────────────────────── */}
      {whoAvoid.length > 0 && (
        <div className="insights-section">
          <div className="insights-title">Who Should Limit or Avoid</div>
          {whoAvoid.map((item, i) => (
            <div className="insight-item" key={i}>
              <span className="insight-icon">🚫</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Healthier alternatives ─────────────────────────── */}
      {alternatives && alternatives !== 'null' && (
        <div className="insights-section">
          <div className="insights-title">Healthier Alternatives</div>
          <div className="insight-item">
            <span className="insight-icon">🥗</span>
            <span>{alternatives}</span>
          </div>
        </div>
      )}

    </div>
  );
}