import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../App';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/auth');
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  const navLinkClass = ({ isActive }) => `navbar-link${isActive ? ' active' : ''}`;

  return (
    <nav className="navbar">
      {/* Brand */}
      <NavLink to="/" className="navbar-brand" onClick={closeMenu}>
        <span>🥗 IngreSight</span>
        <span className="brand-dot" />
      </NavLink>

      {/* Links */}
      <div className={`navbar-links${menuOpen ? ' open' : ''}`}>
        {user && (
          <NavLink to="/" className={navLinkClass} end onClick={closeMenu}>Home</NavLink>
        )}
        <NavLink to="/catalogue" className={navLinkClass} onClick={closeMenu}>Catalogue</NavLink>
        {user && (
          <>
            <NavLink to="/history" className={navLinkClass} onClick={closeMenu}>History</NavLink>
            <NavLink to="/stats" className={navLinkClass} onClick={closeMenu}>Stats</NavLink>
            <NavLink to="/about" className={navLinkClass} onClick={closeMenu}>About</NavLink>
          </>
        )}
      </div>

      {/* Right side */}
      <div className="navbar-right">
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {user ? (
          <>
            <button
              className="navbar-user-btn"
              onClick={() => { navigate('/profile'); closeMenu(); }}
            >
              <span className="navbar-avatar">{user.username[0].toUpperCase()}</span>
              <span style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.username}
              </span>
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/auth')}>
            Log in
          </button>
        )}

        {/* Hamburger */}
        <button
          className="navbar-hamburger"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  );
}