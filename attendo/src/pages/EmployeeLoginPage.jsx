import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function EmployeeLoginPage() {
  const { login } = useAuth();
  const { addToast } = useApp();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    if (!employeeId.trim() || !password) {
      setError('Enter your email ID or Employee ID and password');
      return;
    }
    setLoading(true);
    setTimeout(async () => {
      const result = await login(employeeId, password, 'employee');
      if (result.success) addToast('Login successful');
      else setError('Invalid email ID, Employee ID, or password');
      setLoading(false);
    }, 300);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-logo"><span className="employee-login-mark">E</span></div>
          <h1 className="login-title">Employee Portal</h1>
          <p className="login-subtitle">Access your attendance dashboard</p>
          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="login-error">{error}</div>}
            <div className="form-group">
              <label htmlFor="employee-login-id">Email ID or Employee ID</label>
              <input id="employee-login-id" type="text" placeholder="name@attendo.com or EMP001" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} autoComplete="username" />
            </div>
            <div className="form-group">
              <label htmlFor="employee-login-password">Password</label>
              <input id="employee-login-password" type="password" placeholder="Temporary password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <Link className="login-portal-link" to="/forgot-password">Forgot password?</Link>
          <Link className="login-portal-link" to="/login">Admin Login</Link>
        </div>
      </div>
    </div>
  );
}
