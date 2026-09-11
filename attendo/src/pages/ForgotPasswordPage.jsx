import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [role, setRole] = useState('employee');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setResult(null);
    if (!identifier.trim()) {
      setError('Enter your email ID or Employee ID');
      return;
    }
    const reset = await resetPassword(identifier, role);
    if (!reset.success) setError(reset.error);
    else setResult(reset);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">Reset Password</h1>
          <p className="login-subtitle">Generate a new temporary password for your account</p>
          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="login-error">{error}</div>}
            {result && <div className="login-success">New temporary password: <strong>{result.temporaryPassword}</strong></div>}
            <div className="form-group">
              <label htmlFor="reset-role">Account Type</label>
              <select id="reset-role" value={role} onChange={(event) => setRole(event.target.value)}>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="reset-identifier">Email ID or Employee ID</label>
              <input id="reset-identifier" type="text" placeholder="name@attendo.com or EMP001" value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" />
            </div>
            <button className="btn btn-primary btn-block" type="submit">Reset Password</button>
          </form>
          <Link className="login-portal-link" to={role === 'employee' ? '/employee-login' : '/login'}>Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
