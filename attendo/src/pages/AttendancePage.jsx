import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getCurrentDate, formatDate, formatTime } from '../utils/helpers';
import { LEAVE_TYPES } from '../utils/demoData';
import Modal from '../components/ui/Modal';

export default function AttendancePage() {
  const { user } = useAuth();
  const { employees, attendance, leaves, checkIn, checkOut, startBreak, endBreak, requestLeave, addToast } = useApp();
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEmp, setFilterEmp] = useState('');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ employeeId: '', leaveType: 'Sick Leave', startDate: '', endDate: '', reason: '' });

  const isAdmin = user?.role === 'admin';
  const empId = user?.employeeId;

  const dateAttendance = useMemo(() => {
    return attendance.filter((a) => a.date === selectedDate);
  }, [attendance, selectedDate]);

  const displayData = useMemo(() => {
    let records = [];
    if (isAdmin) {
      records = employees.map((emp) => {
        const att = dateAttendance.find((a) => a.employeeId === emp.id);
        const leave = leaves.find((l) => l.employeeId === emp.id && l.status === 'Approved' && l.startDate <= selectedDate && l.endDate >= selectedDate);
        return {
          employee: emp,
          attendance: att || null,
          leave: leave || null,
          status: att?.status || (leave ? 'Time Off' : 'Absent'),
        };
      });
    } else {
      const emp = employees.find((e) => e.id === empId);
      if (emp) {
        const att = dateAttendance.find((a) => a.employeeId === empId);
        const leave = leaves.find((l) => l.employeeId === empId && l.status === 'Approved' && l.startDate <= selectedDate && l.endDate >= selectedDate);
        records = [{
          employee: emp,
          attendance: att || null,
          leave: leave || null,
          status: att?.status || (leave ? 'Time Off' : 'Absent'),
        }];
      }
    }

    if (filterStatus) {
      records = records.filter((r) => r.status === filterStatus);
    }
    if (filterEmp) {
      records = records.filter((r) => r.employee.id === filterEmp);
    }
    return records;
  }, [employees, dateAttendance, leaves, selectedDate, isAdmin, empId, filterStatus, filterEmp]);

  const handleCheckIn = async (employeeId) => {
    const result = await checkIn(employeeId);
    if (result.success) addToast('Check-in successful');
    else addToast(result.error, 'error');
  };

  const handleCheckOut = async (employeeId) => {
    const result = await checkOut(employeeId);
    if (result.success) addToast('Check-out successful');
    else addToast(result.error, 'error');
  };

  const handleStartBreak = (employeeId) => {
    const result = startBreak(employeeId);
    if (result.success) addToast('Break started');
    else addToast(result.error, 'error');
  };

  const handleEndBreak = (employeeId) => {
    const result = endBreak(employeeId);
    if (result.success) addToast('Break ended');
    else addToast(result.error, 'error');
  };

  const handleLeaveRequest = (e) => {
    e.preventDefault();
    if (!leaveForm.employeeId || !leaveForm.startDate || !leaveForm.endDate) {
      addToast('Please fill in all required fields', 'error');
      return;
    }
    const actualEmpId = isAdmin ? leaveForm.employeeId : empId;
    requestLeave({ employeeId: actualEmpId, leaveType: leaveForm.leaveType, startDate: leaveForm.startDate, endDate: leaveForm.endDate, reason: leaveForm.reason });
    setShowLeaveModal(false);
    setLeaveForm({ employeeId: '', leaveType: 'Sick Leave', startDate: '', endDate: '', reason: '' });
    addToast('Leave request submitted');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Attendance Management</h2>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => setShowLeaveModal(true)}>Request Leave</button>
        </div>
      </div>

      <div className="filters-bar">
        <input type="date" className="date-input" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        {isAdmin && (
          <select value={filterEmp} onChange={(e) => setFilterEmp(e.target.value)}>
            <option value="">All Employees</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        )}
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="Present">Present</option>
          <option value="Late">Late</option>
          <option value="Absent">Absent</option>
          <option value="On Break">On Break</option>
          <option value="Time Off">Time Off</option>
        </select>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Date</th>
              <th>Shift</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Break</th>
              <th>Total Hours</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayData.length === 0 ? (
              <tr><td colSpan="9" className="empty-cell">No records found</td></tr>
            ) : displayData.map((row) => {
              const att = row.attendance;
              const isActive = att?.checkIn && !att?.checkOut;
              const isOnBreak = att?.status === 'On Break';
              const isAbsent = row.status === 'Absent';
              const canAct = isAdmin || row.employee.id === empId;

              return (
                <tr key={row.employee.id}>
                  <td className="fw-600">{row.employee.name}</td>
                  <td>{formatDate(selectedDate)}</td>
                  <td>{row.employee.shift}</td>
                  <td>{att?.checkIn ? formatTime(att.checkIn) : '-'}</td>
                  <td>{att?.checkOut ? formatTime(att.checkOut) : '-'}</td>
                  <td>{att?.breakDuration ? `${att.breakDuration} min` : '-'}</td>
                  <td>{att?.checkOut ? `${att.totalHours}h` : '-'}</td>
                  <td>
                    <span className={`badge badge-${row.status === 'Present' ? 'success' : row.status === 'Late' ? 'danger' : row.status === 'On Break' ? 'warning' : row.status === 'Time Off' ? 'purple' : 'muted'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {canAct && (
                      <>
                        {isAbsent && !row.leave && (
                          <button className="btn btn-sm btn-success" onClick={() => handleCheckIn(row.employee.id)}>Check In</button>
                        )}
                        {isActive && !isOnBreak && (
                          <>
                            <button className="btn btn-sm btn-danger" onClick={() => handleCheckOut(row.employee.id)}>Check Out</button>
                            <button className="btn btn-sm btn-warning" onClick={() => handleStartBreak(row.employee.id)}>Break</button>
                          </>
                        )}
                        {isOnBreak && (
                          <button className="btn btn-sm btn-primary" onClick={() => handleEndBreak(row.employee.id)}>End Break</button>
                        )}
                        {!att?.checkIn && row.leave && (
                          <span className="text-muted">On Leave</span>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showLeaveModal} onClose={() => setShowLeaveModal(false)} title="Request Leave">
        <form onSubmit={handleLeaveRequest}>
          <div className="form-group">
            <label>Employee *</label>
            {isAdmin ? (
              <select value={leaveForm.employeeId} onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })} required>
                <option value="">Select Employee</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            ) : (
              <input type="text" value={employees.find((e) => e.id === empId)?.name || ''} disabled />
            )}
          </div>
          <div className="form-group">
            <label>Leave Type *</label>
            <select value={leaveForm.leaveType} onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}>
              {LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Start Date *</label>
              <input type="date" value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>End Date *</label>
              <input type="date" value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label>Reason</label>
            <textarea value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} rows="3" />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowLeaveModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Request</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
