import { useEffect, useState } from 'react'

function ScoreCard({ data, onForceNew }) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (data) {
      setTimeout(() => setVisible(true), 100)
      const target = data.health_score
      const duration = 1800
      const steps = 90
      const increment = target / steps
      let current = 0
      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          setAnimatedScore(target)
          clearInterval(timer)
        } else {
          setAnimatedScore(Math.round(current))
        }
      }, duration / steps)
      return () => clearInterval(timer)
    }
  }, [data])

  if (!data) return null

  const getScoreColor = (score) => {
    if (score >= 75) return '#22c55e'
    if (score >= 50) return '#eab308'
    if (score >= 25) return '#f97316'
    return '#ef4444'
  }

  const getScoreLabel = (score) => {
    if (score >= 75) return 'Healthy'
    if (score >= 50) return 'Moderate'
    if (score >= 25) return 'Unhealthy'
    return 'Poor'
  }

  const getFrequencyColor = (frequency) => {
    const colors = {
      'Daily': '#22c55e',
      '2-3 times per week': '#22c55e',
      'Once a week': '#eab308',
      'Once or twice a month': '#f97316',
      'Avoid': '#ef4444',
    }
    return colors[frequency] || '#94a3b8'
  }

  const scoreColor = getScoreColor(data.health_score)
  const scorePercent = (animatedScore / 100) * 100

  return (
    <div className={`scorecard ${visible ? 'scorecard-visible' : ''}`}>

      {data._isExisting && (
        <div className="existing-banner">
          <span>📦 Found in our database</span>
          <button className="force-new-btn" onClick={onForceNew}>
            Not your product? Add as new
          </button>
        </div>
      )}

      <div className="product-header">
        <div className="product-meta">
          <p className="product-brand-label">
            {data.brand || 'Unknown Brand'}
          </p>
          <h2 className="product-name">
            {data.product_name || 'Unknown Product'}
          </h2>
        </div>
        <div
          className="score-pill"
          style={{ background: `${scoreColor}18`, borderColor: `${scoreColor}40` }}
        >
          <span className="score-pill-label">Health Score</span>
          <span className="score-pill-number" style={{ color: scoreColor }}>
            {Math.round(animatedScore)}
          </span>
          <span className="score-pill-max">/100</span>
        </div>
      </div>

      <div className="score-bar-section">
        <div className="score-bar-header">
          <span className="score-bar-title">Overall Health Score</span>
          <span className="score-bar-badge" style={{ color: scoreColor }}>
            {getScoreLabel(data.health_score)}
          </span>
        </div>
        <div className="score-bar-track">
          <div
            className="score-bar-fill"
            style={{
              width: `${scorePercent}%`,
              background: `linear-gradient(90deg, ${scoreColor}88, ${scoreColor})`,
              boxShadow: `0 0 20px ${scoreColor}60`,
            }}
          />
          <div
            className="score-bar-marker"
            style={{ left: `${scorePercent}%`, borderColor: scoreColor }}
          />
        </div>
        <div className="score-bar-scale">
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
      </div>

      {data.insights && (
        <>
          <div className="insights-summary">
            <p>{data.insights.summary}</p>
          </div>

          {data.insights.consumption_frequency && (
            <div
              className="frequency-card"
              style={{
                borderColor: `${getFrequencyColor(data.insights.consumption_frequency)}30`,
                background: `${getFrequencyColor(data.insights.consumption_frequency)}08`,
              }}
            >
              <div className="frequency-left">
                <span className="frequency-icon">🗓️</span>
                <div>
                  <p className="frequency-label">Recommended Frequency</p>
                  <p
                    className="frequency-value"
                    style={{
                      color: getFrequencyColor(data.insights.consumption_frequency)
                    }}
                  >
                    {data.insights.consumption_frequency}
                  </p>
                </div>
              </div>
              <p className="frequency-reason">
                {data.insights.frequency_reason}
              </p>
            </div>
          )}

          <div className="insights-row">
            {data.insights.positives?.length > 0 && (
              <div className="insights-card positives-card">
                <h4 className="insights-card-title">
                  <span className="insights-dot green-dot" />
                  Positives
                </h4>
                <ul className="insights-list">
                  {data.insights.positives.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.insights.concerns?.length > 0 && (
              <div className="insights-card concerns-card">
                <h4 className="insights-card-title">
                  <span className="insights-dot orange-dot" />
                  Concerns
                </h4>
                <ul className="insights-list">
                  {data.insights.concerns.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {data.insights.who_should_avoid?.length > 0 && (
            <div className="avoid-section">
              <h4 className="section-label">🚫 Who Should Be Careful</h4>
              <div className="avoid-tags">
                {data.insights.who_should_avoid.map((item, i) => (
                  <span key={i} className="avoid-tag">{item}</span>
                ))}
              </div>
            </div>
          )}

          {data.insights.healthier_alternatives && (
            <div className="alternatives-card">
              <span className="alternatives-icon">💡</span>
              <div>
                <p className="alternatives-title">Healthier Alternatives</p>
                <p className="alternatives-text">
                  {data.insights.healthier_alternatives}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ScoreCard