import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { formatDate, formatTime, getCurrentDate } from '../utils/helpers';

export default function EmployeeDashboardPage() {
  const { user, logout } = useAuth();
  const { employees, attendance, checkIn, checkOut, addToast } = useApp();
  const navigate = useNavigate();
  const employeeId = user?.employeeId;
  const employee = employees.find((item) => item.id === employeeId);
  const ownAttendance = useMemo(
    () => attendance.filter((record) => record.employeeId === employeeId).sort((a, b) => `${b.date} ${b.checkIn || ''}`.localeCompare(`${a.date} ${a.checkIn || ''}`)),
    [attendance, employeeId]
  );
  const todayRecord = ownAttendance.find((record) => record.date === getCurrentDate());

  const handleLogout = () => {
    logout();
    navigate('/employee-login', { replace: true });
  };

  const handleCheckIn = () => {
    const result = checkIn(employeeId);
    if (!result.success) addToast(result.error, 'error');
    else addToast('Check-in recorded');
  };

  const handleCheckOut = () => {
    const result = checkOut(employeeId);
    if (!result.success) addToast(result.error, 'error');
    else addToast('Check-out recorded');
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
      </main>
    </div>
  );
}
