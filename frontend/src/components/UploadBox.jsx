import { useRef, useState } from 'react';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 10;

export default function UploadBox({ onUpload, disabled }) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [fileError, setFileError] = useState('');
  const inputRef = useRef();

  const validate = (file) => {
    if (!ALLOWED.includes(file.type)) {
      setFileError('Only JPG, PNG, and WebP images are allowed.');
      return false;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setFileError(`Image too large. Max size is ${MAX_MB}MB.`);
      return false;
    }
    return true;
  };

  const handleFile = (file) => {
  setFileError('');
  if (!validate(file)) return;
  if (disabled) return;   // ← add this guard
  const url = URL.createObjectURL(file);
  setPreview(url);
  onUpload(file);
};

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const removePreview = (e) => {
    e.stopPropagation();
    setPreview(null);
    setFileError('');
  };

  return (
    <div
      className={`upload-box${dragOver ? ' drag-over' : ''}`}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {preview ? (
        <div className="upload-preview" onClick={e => e.stopPropagation()}>
          <img src={preview} alt="Selected label" />
          <button className="upload-preview-remove" onClick={removePreview} title="Remove">✕</button>
        </div>
      ) : (
        <>
          <div className="upload-icon">
            {dragOver ? '📥' : '📸'}
          </div>
          <div className="upload-title">
            {dragOver ? 'Drop it here!' : 'Upload a nutrition label'}
          </div>
          <div className="upload-sub">
            Drag & drop or click to browse
          </div>
          <div className="upload-hint">
            JPG, PNG, WebP · Max {MAX_MB}MB · Clear, well-lit photos work best
          </div>
        </>
      )}

      {fileError && (
        <div className="form-error" style={{ marginTop: '0.75rem' }}>{fileError}</div>
      )}
    </div>
  );
}