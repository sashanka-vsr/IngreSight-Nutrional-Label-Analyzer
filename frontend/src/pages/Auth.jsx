import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin, register as apiRegister } from '../services/api';

export default function Auth() {
  const [tab, setTab] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    setErrors(e => ({ ...e, [field]: '' }));
    setApiError('');
  };

  const switchTab = (t) => {
    setTab(t);
    setForm({ username: '', email: '', password: '', confirm: '' });
    setErrors({});
    setApiError('');
  };

  const validate = () => {
    const e = {};
    if (tab === 'signup' && form.username.trim().length < 3)
      e.username = 'Username must be at least 3 characters';
    if (!form.email.includes('@'))
      e.email = 'Enter a valid email';
    if (form.password.length < 6)
      e.password = 'Password must be at least 6 characters';
    if (tab === 'signup' && form.password !== form.confirm)
      e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      let data;
      if (tab === 'login') {
        data = await apiLogin(form.email, form.password);
      } else {
        data = await apiRegister(form.username, form.email, form.password);
      }
      login(data.access_token, data.user);
      navigate('/');
    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-text">
            🥗 IngreSight
          </div>
          <div className="auth-logo-sub">AI Nutritional Label Analyzer</div>
        </div>

        {/* Toggle tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab${tab === 'login' ? ' active' : ''}`}
            onClick={() => switchTab('login')}
          >
            Log In
          </button>
          <button
            className={`auth-tab${tab === 'signup' ? ' active' : ''}`}
            onClick={() => switchTab('signup')}
          >
            Sign Up
          </button>
        </div>

        {/* API error */}
        {apiError && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.7rem 1rem',
            fontSize: '0.87rem',
            color: 'var(--unhealthy)',
            marginBottom: '1.25rem',
          }}>
            {apiError}
          </div>
        )}

        {/* Form */}
        {tab === 'signup' && (
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. john doe"
              value={form.username}
              onChange={e => set('username', e.target.value)}
              onKeyDown={handleKey}
              autoFocus
            />
            {errors.username && <div className="form-error">{errors.username}</div>}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            className="form-input"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            onKeyDown={handleKey}
            autoFocus={tab === 'login'}
          />
          {errors.email && <div className="form-error">{errors.email}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            placeholder={tab === 'login' ? 'Your password' : 'At least 6 characters'}
            value={form.password}
            onChange={e => set('password', e.target.value)}
            onKeyDown={handleKey}
          />
          {errors.password && <div className="form-error">{errors.password}</div>}
        </div>

        {tab === 'signup' && (
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Repeat your password"
              value={form.confirm}
              onChange={e => set('confirm', e.target.value)}
              onKeyDown={handleKey}
            />
            {errors.confirm && <div className="form-error">{errors.confirm}</div>}
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading}
          style={{ marginTop: '0.5rem' }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              {tab === 'login' ? 'Logging in…' : 'Creating account…'}
            </span>
          ) : (
            tab === 'login' ? 'Log In' : 'Create Account'
          )}
        </button>

        <p className="text-center text-muted" style={{ marginTop: '1.25rem', fontSize: '0.83rem' }}>
          {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => switchTab(tab === 'login' ? 'signup' : 'login')}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.83rem', fontWeight: 600, padding: 0 }}
          >
            {tab === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}