import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getCurrentDate, formatDate } from '../utils/helpers';

export default function DashboardPage() {
  const { user } = useAuth();
  const { employees, attendance, leaves, addToast } = useApp();
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [activeShift, setActiveShift] = useState('All');
  const [detailFilter, setDetailFilter] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const todayAttendance = useMemo(() =>
    attendance.filter((a) => a.date === selectedDate),
    [attendance, selectedDate]
  );

  const activeEmployees = useMemo(() =>
    employees.filter((e) => e.status === 'Active'),
    [employees]
  );

  const statCards = useMemo(() => {
    const working = todayAttendance.filter((a) => a.checkIn && !a.checkOut && a.status !== 'On Break').length;
    const onBreak = todayAttendance.filter((a) => a.status === 'On Break').length;
    const approvedLeaves = leaves.filter((l) => l.status === 'Approved' && l.startDate <= selectedDate && l.endDate >= selectedDate).length;
    const pendingBiometrics = activeEmployees.filter((e) => !e.biometricRegistered).length;
    return {
      totalEmployees: activeEmployees.length,
      currentlyWorking: working,
      onBreak,
      timeOff: approvedLeaves,
      pendingBiometrics,
    };
  }, [activeEmployees, todayAttendance, leaves, selectedDate]);

  const quickStats = useMemo(() => {
    const filtered = activeShift === 'All' ? todayAttendance : todayAttendance.filter((a) => a.shift === activeShift);
    const filteredEmps = activeShift === 'All' ? activeEmployees : activeEmployees.filter((e) => e.shift === activeShift);
    const checkedIn = filtered.filter((a) => a.checkIn).length;
    const onLeave = leaves.filter((l) => l.status === 'Approved' && l.startDate <= selectedDate && l.endDate >= selectedDate && filteredEmps.some((e) => e.id === l.employeeId)).length;
    const notInYet = filteredEmps.length - checkedIn - onLeave;
    return {
      checkedIn,
      notInYet: Math.max(0, notInYet),
      timeOff: onLeave,
    };
  }, [todayAttendance, activeEmployees, leaves, selectedDate, activeShift]);

  const shiftSummary = useMemo(() => {
    const shifts = ['Open Shift', '8:00 AM TO 6:00 PM', '9:30 TO 6:00', 'Default Shift'];
    return shifts.map((shift) => {
      const shiftEmps = activeEmployees.filter((e) => e.shift === shift);
      const shiftAtt = todayAttendance.filter((a) => a.shift === shift);
      const onTime = shiftAtt.filter((a) => a.status === 'Present').length;
      const late = shiftAtt.filter((a) => a.status === 'Late').length;
      const checkedIn = shiftAtt.filter((a) => a.checkIn).length;
      const onLeave = leaves.filter((l) => l.status === 'Approved' && l.startDate <= selectedDate && l.endDate >= selectedDate && employees.find((e) => e.id === l.employeeId)?.shift === shift).length;
      const notInYet = shiftEmps.length - checkedIn - onLeave;
      return { shift, onTime, late, notInYet: Math.max(0, notInYet), timeOff: onLeave };
    });
  }, [activeEmployees, todayAttendance, leaves, selectedDate, employees]);

  const deptSummary = useMemo(() => {
    const depts = ['Development', 'Design', 'HR', 'Marketing', 'Finance', 'Accounts', 'Office', 'Other'];
    return depts.map((dept) => {
      const deptEmps = activeEmployees.filter((e) => e.department === dept);
      const deptAtt = todayAttendance.filter((a) => {
        const emp = employees.find((e) => e.id === a.employeeId);
        return emp?.department === dept;
      });
      const checkedIn = deptAtt.filter((a) => a.checkIn).length;
      const onLeave = leaves.filter((l) => l.status === 'Approved' && l.startDate <= selectedDate && l.endDate >= selectedDate && employees.find((e) => e.id === l.employeeId)?.department === dept).length;
      const notInYet = deptEmps.length - checkedIn - onLeave;
      return { dept, total: deptEmps.length, checkedIn, notInYet: Math.max(0, notInYet), timeOff: onLeave };
    }).filter((d) => d.total > 0);
  }, [activeEmployees, todayAttendance, leaves, selectedDate, employees]);

  const filteredDetailEmployees = useMemo(() => {
    let emps = activeShift === 'All' ? activeEmployees : activeEmployees.filter((e) => e.shift === activeShift);
    if (detailFilter === 'checkedIn') {
      const ids = todayAttendance.filter((a) => a.checkIn).map((a) => a.employeeId);
      emps = emps.filter((e) => ids.includes(e.id));
    } else if (detailFilter === 'notInYet') {
      const ids = todayAttendance.filter((a) => a.checkIn).map((a) => a.employeeId);
      const leaveIds = leaves.filter((l) => l.status === 'Approved' && l.startDate <= selectedDate && l.endDate >= selectedDate).map((l) => l.employeeId);
      emps = emps.filter((e) => !ids.includes(e.id) && !leaveIds.includes(e.id));
    } else if (detailFilter === 'timeOff') {
      const leaveEmpIds = leaves.filter((l) => l.status === 'Approved' && l.startDate <= selectedDate && l.endDate >= selectedDate).map((l) => l.employeeId);
      emps = emps.filter((e) => leaveEmpIds.includes(e.id));
    }
    return emps;
  }, [activeEmployees, todayAttendance, leaves, selectedDate, detailFilter, activeShift]);

  const shifts = ['All', '8:00 AM TO 6:00 PM', 'Open Shift', 'Default Shift'];

  const getAttForEmp = (empId) => todayAttendance.find((a) => a.employeeId === empId);

  return (
    <div className="dashboard">
      <div className="dashboard-banner">
        <div className="banner-content">
          <h2>Attendo Attendance Management System</h2>
          <p>Welcome back, {user?.name || 'User'}</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{statCards.totalEmployees}</span>
            <span className="stat-label">Total Employees</span>
          </div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{statCards.currentlyWorking}</span>
            <span className="stat-label">Currently Working</span>
          </div>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{statCards.onBreak}</span>
            <span className="stat-label">On Break</span>
          </div>
        </div>
        <div className="stat-card stat-purple">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/></svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{statCards.timeOff}</span>
            <span className="stat-label">Time Off</span>
          </div>
        </div>
        <div className="stat-card stat-yellow">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{statCards.pendingBiometrics}</span>
            <span className="stat-label">Pending Biometrics</span>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h3>Quick Attendance Summary</h3>
          <input
            type="date"
            className="date-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="shift-tabs">
          {shifts.map((s) => (
            <button
              key={s}
              className={`shift-tab ${activeShift === s ? 'active' : ''}`}
              onClick={() => setActiveShift(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="shift-time-note">Shift Time: 8:00 AM TO 6:00 PM</div>

        <div className="quick-stats">
          <div className={`quick-stat-card clickable ${detailFilter === 'checkedIn' ? 'active' : ''}`} onClick={() => setDetailFilter(detailFilter === 'checkedIn' ? null : 'checkedIn')}>
            <span className="qs-value green">{quickStats.checkedIn}</span>
            <span className="qs-label">Checked In</span>
          </div>
          <div className={`quick-stat-card clickable ${detailFilter === 'notInYet' ? 'active' : ''}`} onClick={() => setDetailFilter(detailFilter === 'notInYet' ? null : 'notInYet')}>
            <span className="qs-value red">{quickStats.notInYet}</span>
            <span className="qs-label">Not In Yet</span>
          </div>
          <div className={`quick-stat-card clickable ${detailFilter === 'timeOff' ? 'active' : ''}`} onClick={() => setDetailFilter(detailFilter === 'timeOff' ? null : 'timeOff')}>
            <span className="qs-value purple">{quickStats.timeOff}</span>
            <span className="qs-label">Time Off</span>
          </div>
        </div>

        {detailFilter && (
          <div className="detail-list">
            <div className="detail-list-header">
              <h4>{detailFilter === 'checkedIn' ? 'Checked In Employees' : detailFilter === 'notInYet' ? 'Not In Yet' : 'Employees on Time Off'}</h4>
              <button className="text-btn" onClick={() => setDetailFilter(null)}>Close</button>
            </div>
            {filteredDetailEmployees.length === 0 ? (
              <div className="empty-state-sm">
                <p>No employees found</p>
              </div>
            ) : (
              <div className="detail-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Shift</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDetailEmployees.map((emp) => {
                      const att = getAttForEmp(emp.id);
                      return (
                        <tr key={emp.id}>
                          <td>{emp.name}</td>
                          <td>{emp.department}</td>
                          <td>{emp.shift}</td>
                          <td>
                            <span className={`badge badge-${att?.status === 'On Break' ? 'warning' : att?.status === 'Late' ? 'danger' : att?.checkIn ? 'success' : 'info'}`}>
                              {att?.status || 'Not Checked In'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {todayAttendance.length === 0 && !detailFilter && (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" opacity="0.3">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
              </svg>
            </div>
            <h4>No Attendance Data Available</h4>
            <p>Attendance information will appear here when employees check in.</p>
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <h3>Today&apos;s Shift Wise Attendance Summary</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Shift Name</th>
                <th>On Time</th>
                <th>Late</th>
                <th>Not In Yet</th>
                <th>Time Off</th>
              </tr>
            </thead>
            <tbody>
              {shiftSummary.map((s) => (
                <tr key={s.shift}>
                  <td className="fw-600">{s.shift}</td>
                  <td><span className="badge badge-success">{s.onTime}</span></td>
                  <td><span className="badge badge-danger">{s.late}</span></td>
                  <td><span className="badge badge-warning">{s.notInYet}</span></td>
                  <td><span className="badge badge-purple">{s.timeOff}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-section">
        <h3>Today&apos;s Department Wise Attendance Summary</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Total</th>
                <th>Checked In</th>
                <th>Not In Yet</th>
                <th>Time Off</th>
              </tr>
            </thead>
            <tbody>
              {deptSummary.map((d) => (
                <tr key={d.dept}>
                  <td className="fw-600">{d.dept}</td>
                  <td>{d.total}</td>
                  <td><span className="badge badge-success">{d.checkedIn}</span></td>
                  <td><span className="badge badge-warning">{d.notInYet}</span></td>
                  <td><span className="badge badge-purple">{d.timeOff}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-section">
        <h3>Device Sync Status</h3>
        <div className="device-card">
          <div className="device-info">
            <div className="device-icon">
              <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
            </div>
            <div className="device-details">
              <h4>Attendo Attendance Device</h4>
              <p><strong>ID:</strong> ATT-DEVICE-001</p>
              <p><strong>Status:</strong> <span className="badge badge-success">Online</span></p>
              <p><strong>Last Sync:</strong> {lastSync || 'Not synced yet'}</p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => {
            setSyncing(true);
            setTimeout(() => {
              const now = new Date();
              const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const dateStr = formatDate(now.toISOString().split('T')[0]);
              setLastSync(`${dateStr} ${timeStr}`);
              setSyncing(false);
              addToast('Device synced successfully');
            }, 1500);
          }} disabled={syncing}>
            {syncing ? 'Syncing...' : 'Sync'}
          </button>
        </div>
      </div>
    </div>
  );
}
