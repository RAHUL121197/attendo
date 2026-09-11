import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { formatDate, formatTime, getCurrentDate } from '../utils/helpers';

export default function EmployeeDashboardPage() {
  const { user, logout, changePassword } = useAuth();
  const { employees, attendance, checkIn, checkOut, addToast } = useApp();
  const navigate = useNavigate();
  const employeeId = user?.employeeId;
  const employee = employees.find((item) => item.id === employeeId);
  const ownAttendance = useMemo(
    () => attendance.filter((record) => record.employeeId === employeeId).sort((a, b) => `${b.date} ${b.checkIn || ''}`.localeCompare(`${a.date} ${a.checkIn || ''}`)),
    [attendance, employeeId]
  );
  const todayRecord = ownAttendance.find((record) => record.date === getCurrentDate());
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordMessage, setPasswordMessage] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/employee-login', { replace: true });
  };

  const handleCheckIn = async () => {
    const result = await checkIn(employeeId);
    if (!result.success) addToast(result.error, 'error');
    else addToast('Check-in recorded');
  };

  const handleCheckOut = async () => {
    const result = await checkOut(employeeId);
    if (!result.success) addToast(result.error, 'error');
    else addToast('Check-out recorded');
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordMessage('');
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordMessage('New passwords do not match');
      return;
    }
    const result = await changePassword(passwordForm.current, passwordForm.next);
    if (!result.success) {
      setPasswordMessage(result.error);
      return;
    }
    setPasswordForm({ current: '', next: '', confirm: '' });
    setPasswordMessage('Password changed successfully');
  };

  if (!employee) {
    return <div className="employee-portal"><div className="portal-card"><h2>Employee account unavailable</h2><button className="btn btn-primary" onClick={handleLogout}>Log out</button></div></div>;
  }

  return (
    <div className="employee-portal">
      <header className="employee-portal-header">
        <div><strong>Attendo</strong><span>Employee Portal</span></div>
        <button className="btn btn-secondary" onClick={handleLogout}>Log out</button>
      </header>
      <main className="employee-portal-content">
        <section className="portal-banner">
          <div><p className="eyebrow">Welcome back</p><h1>{employee.name}</h1><p>{employee.designation} · {employee.department}</p></div>
          <div className="portal-id"><span>Employee ID</span><strong>{employee.id.toUpperCase()}</strong></div>
        </section>
        <section className="portal-grid">
          <div className="portal-card"><span className="portal-label">Today</span><strong className="portal-value">{todayRecord?.status || 'Not checked in'}</strong><span>{todayRecord?.checkIn ? `In ${formatTime(todayRecord.checkIn)}` : 'Your attendance status'}</span></div>
          <div className="portal-card"><span className="portal-label">Shift</span><strong className="portal-value">{employee.shift}</strong><span>{employee.status} employee</span></div>
          <div className="portal-card portal-actions"><span className="portal-label">Attendance action</span>{!todayRecord ? <button className="btn btn-primary" onClick={handleCheckIn}>Check in</button> : !todayRecord.checkOut ? <button className="btn btn-primary" onClick={handleCheckOut}>Check out</button> : <span>Completed for today</span>}</div>
        </section>
        <section className="portal-card portal-history"><div className="section-heading"><h2>My Attendance</h2><span>{ownAttendance.length} records</span></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Date</th><th>Shift</th><th>Check In</th><th>Check Out</th><th>Status</th><th>Hours</th></tr></thead><tbody>{ownAttendance.length === 0 ? <tr><td colSpan="6" className="empty-cell">No attendance records yet</td></tr> : ownAttendance.map((record) => <tr key={record.id}><td>{formatDate(record.date)}</td><td>{record.shift}</td><td>{formatTime(record.checkIn)}</td><td>{formatTime(record.checkOut)}</td><td>{record.status}</td><td>{record.totalHours || 0}h</td></tr>)}</tbody></table></div></section>
        <section className="portal-card password-card"><div className="section-heading"><h2>Change Password</h2><span>Use at least 8 characters</span></div><form className="password-form" onSubmit={handlePasswordChange}><input type="password" placeholder="Current password" value={passwordForm.current} onChange={(event) => setPasswordForm({ ...passwordForm, current: event.target.value })} autoComplete="current-password" required /><input type="password" placeholder="New password" value={passwordForm.next} onChange={(event) => setPasswordForm({ ...passwordForm, next: event.target.value })} autoComplete="new-password" minLength={8} required /><input type="password" placeholder="Confirm new password" value={passwordForm.confirm} onChange={(event) => setPasswordForm({ ...passwordForm, confirm: event.target.value })} autoComplete="new-password" minLength={8} required /><button className="btn btn-primary" type="submit">Change Password</button></form>{passwordMessage && <p className="form-status">{passwordMessage}</p>}</section>
      </main>
    </div>
  );
}
