import { useState, useRef } from 'react'

function UploadBox({ onAnalyze, isLoading }) {
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFile = (file) => {
    setError(null)

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB')
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  const handleInputChange = (e) => {
    const file = e.target.files[0]
    if (file) handleFile(file)
  }

  const handleSubmit = () => {
    if (selectedFile && onAnalyze) {
      onAnalyze(selectedFile)
    }
  }

  const handleClear = () => {
    setPreview(null)
    setSelectedFile(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="upload-container">
      <div
        className={`upload-box ${dragOver ? 'drag-over' : ''} ${preview ? 'has-preview' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !preview && fileInputRef.current.click()}
      >
        {!preview ? (
          <div className="upload-placeholder">
            <div className="upload-icon">📸</div>
            <h3>Upload Nutrition Label</h3>
            <p>Drag and drop or click to browse</p>
            <p className="upload-hint">Supports JPG, PNG, WEBP up to 10MB</p>
          </div>
        ) : (
          <div className="preview-container">
            <img src={preview} alt="Preview" className="preview-image" />
            <div className="preview-overlay">
              <span>Click analyze to scan this label</span>
            </div>
          </div>
        )}
      </div>

      {error && <p className="upload-error">{error}</p>}

      {preview && (
        <div className="upload-actions">
          <button
            className="btn-secondary"
            onClick={handleClear}
            disabled={isLoading}
          >
            Clear
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-text">
                <span className="spinner"></span>
                Analyzing...
              </span>
            ) : (
              '🔍 Analyze Label'
            )}
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default UploadBox