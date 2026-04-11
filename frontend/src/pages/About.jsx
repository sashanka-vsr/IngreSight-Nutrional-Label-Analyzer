const FEATURES = [
  { icon: '🤖', title: 'AI Vision Extraction', desc: 'Google Gemini 2.5 Flash reads nutrition labels directly from images — no OCR, no manual entry.' },
  { icon: '📊', title: 'Transparent Scoring', desc: 'Rule-based weighted engine scores 6 key nutrients. Every point has a clear mathematical justification.' },
  { icon: '📅', title: 'Consumption Frequency', desc: 'AI recommends how often you should consume a product — from Daily to Avoid — based on its nutritional profile.' },
  { icon: '⚡', title: 'Duplicate Detection', desc: 'Upload the same product twice and get instant results from cache. No redundant Gemini API calls.' },
  { icon: '🗂️', title: 'Global Catalogue', desc: 'Every scanned product is added to a shared A-Z database accessible to all users for browsing and discovery.' },
  { icon: '👤', title: 'Per-User History', desc: 'Your scan history is private to you. Removing from history keeps the product in the shared catalogue.' },
];

const SCORING_ROWS = [
  { nutrient: 'Calories',       weight: 25, reason: 'Primary driver of weight gain and energy imbalance' },
  { nutrient: 'Sugar',          weight: 25, reason: 'Strongly linked to diabetes, obesity, and metabolic disease' },
  { nutrient: 'Sodium',         weight: 20, reason: 'Major cause of hypertension and cardiovascular risk' },
  { nutrient: 'Total Fat',      weight: 15, reason: 'Saturated fat directly impacts cholesterol and heart health' },
  { nutrient: 'Dietary Fiber',  weight: 10, reason: 'Beneficial — improves digestion and lowers cholesterol' },
  { nutrient: 'Protein',        weight: 5,  reason: 'Essential for muscle repair and satiety' },
];

const SCORE_LABELS = [
  { range: '75 – 100', label: 'Healthy',    color: 'var(--healthy)',   desc: 'Safe for regular, even daily consumption' },
  { range: '50 – 74',  label: 'Moderate',   color: 'var(--moderate)',  desc: 'Fine a few times a week with a balanced diet' },
  { range: '25 – 49',  label: 'Unhealthy',  color: 'var(--unhealthy)', desc: 'Limit to occasional treats — once a week or less' },
  { range: '0 – 24',   label: 'Poor',       color: 'var(--poor)',      desc: 'Best avoided or consumed very rarely' },
];

const STACK = [
  { layer: 'Frontend',       tech: 'React + Vite (JavaScript)' },
  { layer: 'Backend',        tech: 'Python + FastAPI' },
  { layer: 'Database',       tech: 'MongoDB Atlas (Free Tier)' },
  { layer: 'AI Vision',      tech: 'Google Gemini 2.5 Flash' },
  { layer: 'Auth',           tech: 'JWT + bcrypt (passlib)' },
  { layer: 'Frontend Host',  tech: 'Vercel' },
  { layer: 'Backend Host',   tech: 'Render' },
];

export default function About() {
  return (
    <div className="page">
      {/* Hero */}
      <div className="about-hero">
        <h1 className="about-title">About IngreSight</h1>
        <p className="about-subtitle">
          A hybrid AI + rule-based system for transparent, explainable nutritional analysis —
          built as a minor academic project in Computer Science.
        </p>
        <br />
        <p className="about-subtitle">
          Note that this website is not designed for mobile interfaces, would like to explore in future :)
        </p>
      </div>

      {/* Features grid */}
      <div className="about-grid">
        {FEATURES.map(f => (
          <div className="about-feature-card" key={f.title}>
            <div className="about-feature-icon">{f.icon}</div>
            <div className="about-feature-title">{f.title}</div>
            <div className="about-feature-desc">{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Scoring model */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="profile-section-title" style={{ marginBottom: '1.25rem' }}>
          Scoring Model
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.7 }}>
          Each nutrient is independently scored 0–100 against WHO and FDA daily reference values,
          then combined using a weighted average. Beneficial nutrients (fiber, protein) are
          scored higher when their values are higher. Harmful nutrients (sugar, sodium, fat, calories)
          are scored higher when their values are lower.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="scoring-table">
            <thead>
              <tr>
                <th>Nutrient</th>
                <th>Weight</th>
                <th style={{ minWidth: 80 }}>Visual</th>
                <th>Rationale</th>
              </tr>
            </thead>
            <tbody>
              {SCORING_ROWS.map(row => (
                <tr key={row.nutrient}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.nutrient}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{row.weight}%</td>
                  <td>
                    <div className="weight-bar">
                      <div className="weight-track">
                        <div className="weight-fill" style={{ width: `${row.weight * 4}%` }} />
                      </div>
                    </div>
                  </td>
                  <td>{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Score labels */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="profile-section-title" style={{ marginBottom: '1.25rem' }}>Score Labels</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
          {SCORE_LABELS.map(s => (
            <div key={s.label} style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${s.color}40`,
              background: `${s.color}12`,
            }}>
              <div style={{ fontWeight: 700, color: s.color, marginBottom: '0.25rem' }}>
                {s.range} — {s.label}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="profile-section-title" style={{ marginBottom: '1.25rem' }}>Tech Stack</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem' }}>
          {STACK.map(s => (
            <div key={s.layer} style={{
              display: 'flex', gap: '0.75rem', alignItems: 'center',
              padding: '0.65rem 0.85rem',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', width: 90, flexShrink: 0 }}>
                {s.layer.toUpperCase()}
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500 }}>{s.tech}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Academic note */}
      <div style={{
        background: 'var(--accent-glow)',
        border: '1px solid var(--border-hover)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
      }}>
        <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
          📚 Academic Context
        </div>
        <div style={{ fontSize: '0.87rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Project Title:</strong> AI Agent for Nutritional Label Analysis and Health Risk Evaluation
          <br />
          <strong style={{ color: 'var(--text-primary)' }}>Type:</strong> Minor Academic Project — Computer Science
          <br />
          <strong style={{ color: 'var(--text-primary)' }}>Key Points:</strong> Hybrid AI + rule-based scoring (transparent & explainable) ·
          Cloud-native architecture · RESTful API design · Dynamic duplicate-aware product catalogue with per-user history
        </div>
      </div>
    </div>
  );
}