import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { addToast } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const result = login(email, password, 'admin');
      if (result.success) {
        addToast('Login successful');
      } else {
        setError(result.error);
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-logo">
            <svg viewBox="0 0 60 60" width="60" height="60">
              <defs>
                <linearGradient id="loginGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#4f46e5' }} />
                  <stop offset="100%" style={{ stopColor: '#7c3aed' }} />
                </linearGradient>
              </defs>
              <rect width="60" height="60" rx="16" fill="url(#loginGrad)" />
              <text x="30" y="27" fontFamily="Arial,sans-serif" fontSize="24" fontWeight="bold" fill="white" textAnchor="middle">A</text>
              <text x="30" y="43" fontFamily="Arial,sans-serif" fontSize="9" fill="rgba(255,255,255,0.85)" textAnchor="middle">ATTENDO</text>
            </svg>
          </div>
          <h1 className="login-title">Attendo</h1>
          <p className="login-subtitle">Employee Attendance Management System</p>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="login-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>


            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="login-demo">
            <p>Demo Credentials:</p>
            <div className="demo-creds">
              <button type="button" className="demo-btn" onClick={() => { setEmail('admin@attendo.com'); setPassword('123456'); }}>
                Admin: admin@attendo.com
              </button>
            </div>
          </div>
          <Link className="login-portal-link" to="/forgot-password">Forgot password?</Link>
          <Link className="login-portal-link" to="/employee-login">Employee Portal Login</Link>
        </div>
      </div>
    </div>
  );
}
