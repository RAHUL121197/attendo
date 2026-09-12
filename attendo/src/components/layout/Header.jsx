import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export default function Header({ onMenuToggle }) {
  const { user } = useAuth();
  const { notifications, markNotificationRead, clearNotifications } = useApp();
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user?.name ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) : 'U';

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onMenuToggle} aria-label="Toggle menu">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
        </button>
        <div className="header-brand">
          <svg viewBox="0 0 32 32" width="32" height="32">
            <defs>
              <linearGradient id="hdrGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#0f766e' }} />
                <stop offset="100%" style={{ stopColor: '#0e7490' }} />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#hdrGrad)" />
            <text x="16" y="15" fontFamily="Arial,sans-serif" fontSize="14" fontWeight="bold" fill="white" textAnchor="middle">A</text>
            <text x="16" y="24" fontFamily="Arial,sans-serif" fontSize="5.5" fill="rgba(255,255,255,0.85)" textAnchor="middle">ATTENDO</text>
          </svg>
          <span className="header-title">Attendo</span>
        </div>
        <span className="header-company">Attendo Attendance Management System</span>
      </div>

      <div className="header-right">
        <div className="header-notif" ref={notifRef}>
          <button className="icon-btn" onClick={() => setShowNotif(!showNotif)} aria-label="Notifications">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
            {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
          {showNotif && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <h4>Notifications</h4>
                {notifications.length > 0 && (
                  <button className="text-btn" onClick={clearNotifications}>Clear all</button>
                )}
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">No notifications</div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className={`notif-item ${n.read ? '' : 'unread'}`}
                      onClick={() => markNotificationRead(n.id)}
                    >
                      <div className={`notif-dot notif-dot-${n.type}`} />
                      <div className="notif-content">
                        <p>{n.message}</p>
                        <span className="notif-time">{n.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="header-user" ref={userRef}>
          <button className="user-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-role">{user?.role === 'admin' ? 'Admin' : 'Employee'}</span>
            </div>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="chevron">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>
          {showUserMenu && (
            <div className="user-dropdown">
              <div className="user-dropdown-info">
                <div className="user-avatar user-avatar-lg">{initials}</div>
                <div>
                  <strong>{user?.name}</strong>
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
