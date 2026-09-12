import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

const adminMenu = [
  { to: '/', icon: 'dashboard', label: 'Dashboard' },
  { to: '/employees', icon: 'people', label: 'Employees' },
  { to: '/attendance', icon: 'event_available', label: 'Attendance' },
  { to: '/reports', icon: 'assessment', label: 'Reports' },
  { to: '/settings', icon: 'settings', label: 'Settings' },
];

const employeeMenu = [
  { to: '/', icon: 'dashboard', label: 'Dashboard' },
  { to: '/attendance', icon: 'event_available', label: 'Attendance' },
  { to: '/reports', icon: 'assessment', label: 'Reports' },
];

const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
    </svg>
  ),
  people: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
    </svg>
  ),
  event_available: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
    </svg>
  ),
  assessment: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
    </svg>
  ),
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useApp();
  const menu = user?.role === 'admin' ? adminMenu : employeeMenu;

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">
            <svg viewBox="0 0 40 40" width="40" height="40">
              <defs>
                <linearGradient id="sidebarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#0f766e' }} />
                  <stop offset="100%" style={{ stopColor: '#0e7490' }} />
                </linearGradient>
              </defs>
              <rect width="40" height="40" rx="10" fill="url(#sidebarGrad)" />
              <text x="20" y="18" fontFamily="Arial,sans-serif" fontSize="16" fontWeight="bold" fill="white" textAnchor="middle">A</text>
              <text x="20" y="30" fontFamily="Arial,sans-serif" fontSize="6" fill="rgba(255,255,255,0.85)" textAnchor="middle">ATTENDO</text>
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-name">Attendo</span>
            <span className="brand-sub">Attendance System</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="sidebar-icon">{icons[item.icon]}</span>
              <span className="sidebar-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="sidebar-link" onClick={toggleDarkMode}>
            <span className="sidebar-icon">
              {darkMode ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.42 0-.39.39-.39 1.03 0 1.42l1.42 1.42c.39.39 1.03.39 1.42 0s.39-1.03 0-1.42L5.99 4.58zm12.03 12.02c-.39-.39-1.03-.39-1.42 0-.39.39-.39 1.03 0 1.42l1.42 1.42c.39.39 1.03.39 1.42 0 .39-.39.39-1.03 0-1.42l-1.42-1.42zm1.41-10.6c.39-.39.39-1.03 0-1.42-.39-.39-1.03-.39-1.42 0l-1.42 1.42c-.39.39-.39 1.03 0 1.42s1.03.39 1.42 0l1.42-1.42zM7.41 18.36c.39-.39.39-1.03 0-1.42-.39-.39-1.03-.39-1.42 0l-1.42 1.42c-.39.39-.39 1.03 0 1.42s1.03.39 1.42 0l1.42-1.42z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
                </svg>
              )}
            </span>
            <span className="sidebar-label">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button className="sidebar-link sidebar-logout" onClick={logout}>
            <span className="sidebar-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
            </span>
            <span className="sidebar-label">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
