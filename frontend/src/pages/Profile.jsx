import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { changePassword, deleteAccount, getHistory } from '../services/api';

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

  const [scanCount, setScanCount] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: '' });

  useEffect(() => {
    getHistory(1, 1)
      .then(d => setScanCount(d.total))
      .catch(() => setScanCount(0));
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3500);
  };

  // ── Password change ────────────────────────────────────────────────────────
  const setPw = (field, val) => {
    setPwForm(f => ({ ...f, [field]: val }));
    setPwErrors(e => ({ ...e, [field]: '' }));
    setPwMsg('');
  };

  const validatePw = () => {
    const e = {};
    if (!pwForm.current) e.current = 'Enter your current password';
    if (pwForm.next.length < 6) e.next = 'New password must be at least 6 characters';
    if (pwForm.next !== pwForm.confirm) e.confirm = 'Passwords do not match';
    setPwErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePw()) return;
    setPwLoading(true);
    try {
      await changePassword(pwForm.current, pwForm.next);
      setPwForm({ current: '', next: '', confirm: '' });
      showToast('Password updated successfully');
    } catch (err) {
      setPwErrors({ current: err.message || 'Failed to update password' });
    } finally {
      setPwLoading(false);
    }
  };

  // ── Delete account ─────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await deleteAccount();
      logout();
      navigate('/auth');
    } catch {
      showToast('Failed to delete account. Try again.', 'error');
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const initials = user?.username ? user.username[0].toUpperCase() : '?';
  const joinDate = 'March 2026'; // placeholder — add created_at to UserResponse if needed

  return (
    <div className="page">
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 className="page-title">Profile & Settings</h1>
        <p className="page-subtitle">Manage your account details and preferences</p>
      </div>

      <div className="profile-grid">
        {/* ── Left sidebar ─────────────────────────────────── */}
        <div className="profile-sidebar-card">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-name">{user?.username}</div>
          <div className="profile-email">{user?.email}</div>

          <div className="profile-stat-row">
            <div className="profile-stat">
              <div className="profile-stat-val">{scanCount ?? '—'}</div>
              <div className="profile-stat-lbl">Scans</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-val" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {joinDate}
              </div>
              <div className="profile-stat-lbl">Joined</div>
            </div>
          </div>
        </div>

        {/* ── Right panel ──────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Account info */}
          <div className="card">
            <div className="profile-section-title">Account Info</div>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div className="form-label">Username</div>
                  <div style={{
                    padding: '0.65rem 1rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.92rem',
                  }}>
                    {user?.username}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div className="form-label">Email</div>
                  <div style={{
                    padding: '0.65rem 1rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.92rem',
                  }}>
                    {user?.email}
                  </div>
                </div>
              </div>
              <p className="text-muted">Username and email cannot be changed currently.</p>
            </div>
          </div>

          {/* Change password */}
          <div className="card">
            <div className="profile-section-title">Change Password</div>

            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Enter current password"
                value={pwForm.current}
                onChange={e => setPw('current', e.target.value)}
              />
              {pwErrors.current && <div className="form-error">{pwErrors.current}</div>}
            </div>

            <div style={{ display: 'grid', grid: '1fr/1fr 1fr', gap: '0.75rem' }} className="pw-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">New Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="At least 6 characters"
                  value={pwForm.next}
                  onChange={e => setPw('next', e.target.value)}
                />
                {pwErrors.next && <div className="form-error">{pwErrors.next}</div>}
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Confirm New Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Repeat new password"
                  value={pwForm.confirm}
                  onChange={e => setPw('confirm', e.target.value)}
                />
                {pwErrors.confirm && <div className="form-error">{pwErrors.confirm}</div>}
              </div>
            </div>

            <button
              className="btn btn-outline"
              style={{ marginTop: '1.25rem', width: 'auto' }}
              onClick={handleChangePassword}
              disabled={pwLoading}
            >
              {pwLoading ? 'Updating…' : 'Update Password'}
            </button>
          </div>

          {/* Danger zone */}
          <div className="danger-zone">
            <div className="danger-zone-title">⚠️ Danger Zone</div>
            <div className="danger-zone-desc">
              Deleting your account will remove your scan history and profile permanently.
              All products you scanned will remain in the global catalogue.
            </div>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete My Account
            </button>
          </div>

        </div>
      </div>

      {/* ── Delete confirmation modal ─────────────────────── */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Delete Account?</div>
            <div className="modal-desc">
              This will permanently delete your profile and scan history.
              This action <strong>cannot be undone</strong>. Products you analyzed will stay
              in the global catalogue for other users.
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-ghost"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting…' : 'Yes, delete account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.msg && (
        <div className={`toast toast-${toast.type || 'success'}`}>{toast.msg}</div>
      )}
    </div>
  );
}