import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { addToast } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
    setTimeout(async () => {
      const result = await login(email, password, 'admin');
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
      <div className="login-shell">
        <section className="login-intro">
          <div className="login-brand-lockup">
            <div className="login-logo-mark">A</div>
            <div><strong>Attendo</strong><span>Workforce operations</span></div>
          </div>
          <div className="login-intro-copy">
            <span className="eyebrow">Attendance, simplified</span>
            <h1>Keep your team moving forward.</h1>
            <p>One calm workspace for attendance, people, and the work that happens every day.</p>
          </div>
          <div className="login-signal-grid" aria-hidden="true">
            <div><strong>98.6%</strong><span>Attendance clarity</span></div>
            <div><strong>24/7</strong><span>Always in sync</span></div>
          </div>
        </section>

        <section className="login-card">
          <div className="login-card-heading">
            <span className="eyebrow">Admin workspace</span>
            <h2>Welcome back</h2>
            <p>Sign in to continue to your dashboard.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="login-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="login-email">Employee ID or email</label>
              <input id="login-email" type="email" placeholder="you@attendo.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <div className="password-input-wrap">
                <input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                <button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Hide' : 'Show'}</button>
              </div>
            </div>

            <div className="login-options">
              <label className="remember-option"><input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /> <span>Remember me</span></label>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
            <button className="btn btn-primary btn-block login-submit" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in to Attendo'}
            </button>
          </form>

          <div className="login-demo">
            <p>Need a quick start?</p>
            <button type="button" className="demo-btn" onClick={() => { setEmail('admin@attendo.com'); setPassword('123456'); }}>Use admin demo account</button>
          </div>
          <div className="login-footer-links">
            <Link to="/employee-login">Employee portal</Link>
            <button type="button" onClick={() => addToast('Please contact your Attendo administrator', 'info')}>Contact admin</button>
          </div>
        </section>
      </div>
    </div>
  );
}
