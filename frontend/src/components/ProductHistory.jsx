import { useState, useEffect } from 'react'
import { getHistory, deleteProduct } from '../services/api'

function ProductHistory({ onSelectProduct }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const limit = 10

  useEffect(() => {
    fetchHistory()
  }, [skip])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const response = await getHistory(limit, skip)
      setProducts(response.data)
      setTotal(response.total)
    } catch (err) {
      setError('Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (e, productId) => {
    e.stopPropagation()
    if (!window.confirm('Delete this product from history?')) return
    try {
      await deleteProduct(productId)
      fetchHistory()
    } catch (err) {
      alert('Failed to delete product')
    }
  }

  const getScoreColor = (score) => {
    if (score >= 75) return '#00ff88'
    if (score >= 50) return '#ffcc00'
    if (score >= 25) return '#ff8800'
    return '#ff4444'
  }

  const getScoreLabel = (score) => {
    if (score >= 75) return 'Healthy'
    if (score >= 50) return 'Moderate'
    if (score >= 25) return 'Unhealthy'
    return 'Poor'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="history-loading">
        <div className="spinner-large"></div>
        <p>Loading history...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="history-error">
        <p>{error}</p>
        <button className="btn-secondary" onClick={fetchHistory}>
          Try Again
        </button>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="history-empty">
        <div className="empty-icon">📭</div>
        <h3>No products analyzed yet</h3>
        <p>Upload a nutrition label to get started</p>
      </div>
    )
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h2>📋 Product History</h2>
        <span className="history-count">{total} products analyzed</span>
      </div>

      <div className="history-grid">
        {products.map((product) => (
          <div
            key={product._id}
            className="history-card"
            onClick={() => onSelectProduct && onSelectProduct(product)}
          >
            <div className="history-card-header">
              <div className="history-product-info">
                <h4 className="history-product-name">
                  {product.product_name || 'Unknown Product'}
                </h4>
                {product.brand && (
                  <span className="history-brand">{product.brand}</span>
                )}
              </div>

              <div
                className="history-score-badge"
                style={{ borderColor: getScoreColor(product.health_score) }}
              >
                <span
                  className="history-score-number"
                  style={{ color: getScoreColor(product.health_score) }}
                >
                  {product.health_score}
                </span>
                <span
                  className="history-score-label"
                  style={{ color: getScoreColor(product.health_score) }}
                >
                  {getScoreLabel(product.health_score)}
                </span>
              </div>
            </div>

            {product.insights?.consumption_frequency && (
              <div className="history-frequency">
                🗓️ {product.insights.consumption_frequency}
              </div>
            )}

            <div className="history-card-footer">
              <span className="history-date">
                {formatDate(product.analyzed_at)}
              </span>
              <button
                className="delete-btn"
                onClick={(e) => handleDelete(e, product._id)}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {total > limit && (
        <div className="pagination">
          <button
            className="btn-secondary"
            disabled={skip === 0}
            onClick={() => setSkip(Math.max(0, skip - limit))}
          >
            ← Previous
          </button>
          <span className="pagination-info">
            {Math.floor(skip / limit) + 1} of {Math.ceil(total / limit)}
          </span>
          <button
            className="btn-secondary"
            disabled={skip + limit >= total}
            onClick={() => setSkip(skip + limit)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

export default ProductHistory