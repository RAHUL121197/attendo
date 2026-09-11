import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DEPARTMENTS } from '../utils/demoData';
import { getCurrentDate } from '../utils/helpers';
import { buildEmployeeReportContext, buildReportPrompt, requestAIReport, parseAISections, extractRating } from '../utils/aiReport';
import Modal from '../components/ui/Modal';

export default function ReportsPage() {
  const { employees, attendance, leaves, settings, addToast } = useApp();
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(getCurrentDate());
  const [filterDept, setFilterDept] = useState('');
  const [filterEmp, setFilterEmp] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [aiEmpId, setAiEmpId] = useState(employees[0]?.id || '');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState('');
  const [aiError, setAiError] = useState('');
  const [showAiReport, setShowAiReport] = useState(false);

  const filteredAttendance = useMemo(() => {
    return attendance.filter((a) => {
      if (a.date < dateFrom || a.date > dateTo) return false;
      const emp = employees.find((e) => e.id === a.employeeId);
      if (!emp) return false;
      if (filterDept && emp.department !== filterDept) return false;
      if (filterEmp && a.employeeId !== filterEmp) return false;
      if (filterStatus && a.status !== filterStatus) return false;
      return true;
    });
  }, [attendance, dateFrom, dateTo, filterDept, filterEmp, filterStatus, employees]);

  const totals = useMemo(() => ({
    totalCheckins: filteredAttendance.length,
    totalHours: filteredAttendance.reduce((sum, a) => sum + (a.totalHours || 0), 0),
    totalLate: filteredAttendance.filter((a) => a.status === 'Late').length,
  }), [filteredAttendance]);

  const employeeReports = useMemo(() => {
    const empMap = {};
    employees.forEach((emp) => {
      if (filterDept && emp.department !== filterDept) return;
      if (filterEmp && emp.id !== filterEmp) return;
      empMap[emp.id] = {
        employee: emp,
        present: 0,
        late: 0,
        absent: 0,
        timeOff: 0,
        totalHours: 0,
      };
    });

    filteredAttendance.forEach((a) => {
      if (!empMap[a.employeeId]) return;
      if (a.status === 'Present') empMap[a.employeeId].present++;
      else if (a.status === 'Late') empMap[a.employeeId].late++;
      empMap[a.employeeId].totalHours += a.totalHours || 0;
    });

    leaves.filter((l) => l.status === 'Approved' && l.startDate >= dateFrom && l.startDate <= dateTo).forEach((l) => {
      if (empMap[l.employeeId]) {
        empMap[l.employeeId].timeOff++;
      }
    });

    const days = Math.max(1, Math.ceil((new Date(dateTo) - new Date(dateFrom)) / (1000 * 60 * 60 * 24)) + 1);

    return Object.values(empMap).map((r) => ({
      ...r,
      absent: Math.max(0, days - r.present - r.late - r.timeOff),
      totalHours: Math.round(r.totalHours * 100) / 100,
      attendancePct: days > 0 ? Math.round(((r.present + r.late) / days) * 100) : 0,
    }));
  }, [employees, filteredAttendance, leaves, dateFrom, dateTo, filterDept, filterEmp]);

  const activeAttendanceRate = useMemo(() => {
    if (employeeReports.length === 0) return 0;
    const totalPct = employeeReports.reduce((sum, r) => sum + r.attendancePct, 0);
    return Math.round(totalPct / employeeReports.length);
  }, [employeeReports]);

  const exportCSV = () => {
    const headers = ['Employee', 'Employee ID', 'Date', 'Shift', 'Check In', 'Check Out', 'Break', 'Total Hours', 'Status'];
    const rows = filteredAttendance.map((a) => {
      const emp = employees.find((e) => e.id === a.employeeId);
      return [emp?.name || '', a.employeeId, a.date, a.shift, a.checkIn || '', a.checkOut || '', a.breakDuration ? `${a.breakDuration} min` : '', a.totalHours || '', a.status];
    });

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendo-attendance-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  const resetFilters = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    setDateFrom(d.toISOString().split('T')[0]);
    setDateTo(getCurrentDate());
    setFilterDept('');
    setFilterEmp('');
    setFilterStatus('');
  };

  const closeAIReport = () => {
    setShowAiReport(false);
    setAiLoading(false);
    setAiReport('');
    setAiError('');
  };

  const handleGenerateAIReport = async () => {
    if (aiLoading) return;
    const emp = employees.find((e) => e.id === aiEmpId);
    if (!emp) {
      addToast('Select an employee first', 'error');
      return;
    }
    const stats = employeeReports.find((r) => r.employee.id === emp.id) || {
      present: 0, late: 0, absent: 0, timeOff: 0, totalHours: 0, attendancePct: 0,
    };
    const ctx = buildEmployeeReportContext({
      employee: emp,
      stats,
      settings,
      range: { from: dateFrom, to: dateTo },
    });
    const prompt = buildReportPrompt(ctx);

    setShowAiReport(true);
    setAiLoading(true);
    setAiError('');
    setAiReport('');
    try {
      const content = await requestAIReport(prompt);
      setAiReport(content);
    } catch (err) {
      setAiError(err.message || 'Something went wrong while generating the AI report.');
    } finally {
      setAiLoading(false);
    }
  };

  const aiSections = useMemo(() => (aiReport ? parseAISections(aiReport) : []), [aiReport]);
  const aiRating = useMemo(() => (aiReport ? extractRating(aiReport) : null), [aiReport]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Reports</h2>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={printReport}>Print</button>
          <button className="btn btn-primary" onClick={exportCSV}>Export CSV</button>
        </div>
      </div>

      <div className="report-cards">
        <div className="report-card">
          <span className="report-value">{activeAttendanceRate}%</span>
          <span className="report-label">Attendance Rate</span>
        </div>
        <div className="report-card">
          <span className="report-value">{totals.totalCheckins}</span>
          <span className="report-label">Total Check-ins</span>
        </div>
        <div className="report-card">
          <span className="report-value">{totals.totalHours.toFixed(1)}h</span>
          <span className="report-label">Total Working Hours</span>
        </div>
        <div className="report-card">
          <span className="report-value">{totals.totalLate}</span>
          <span className="report-label">Total Late</span>
        </div>
      </div>

      <div className="filters-bar">
        <div className="form-group inline">
          <label>From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="form-group inline">
          <label>To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filterEmp} onChange={(e) => setFilterEmp(e.target.value)}>
          <option value="">All Employees</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="Present">Present</option>
          <option value="Late">Late</option>
        </select>
        <button className="btn btn-secondary" onClick={resetFilters}>Reset</button>
      </div>

      <div className="ai-report-panel">
        <div className="ai-report-heading">
          <div className="ai-report-h2">AI Report</div>
          <div className="ai-report-note">Generate a performance summary, strengths, weaknesses, and a rating for a selected employee using AgentRouter.</div>
        </div>
        <div className="ai-report-bar">
          <select className="ai-employee-select" value={aiEmpId} onChange={(e) => setAiEmpId(e.target.value)}>
            <option value="">Select Employee</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={handleGenerateAIReport} disabled={aiLoading}>
            {aiLoading ? 'Generating...' : 'Generate AI Report'}
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>ID</th>
              <th>Department</th>
              <th>Present</th>
              <th>Late</th>
              <th>Absent</th>
              <th>Time Off</th>
              <th>Total Hours</th>
              <th>Attendance %</th>
            </tr>
          </thead>
          <tbody>
            {employeeReports.length === 0 ? (
              <tr><td colSpan="9" className="empty-cell">No report data available</td></tr>
            ) : employeeReports.map((r) => (
              <tr key={r.employee.id}>
                <td className="fw-600">{r.employee.name}</td>
                <td className="mono">{r.employee.id.toUpperCase()}</td>
                <td>{r.employee.department}</td>
                <td><span className="badge badge-success">{r.present}</span></td>
                <td><span className="badge badge-danger">{r.late}</span></td>
                <td>{r.absent}</td>
                <td><span className="badge badge-purple">{r.timeOff}</span></td>
                <td>{r.totalHours}h</td>
                <td>
                  <div className="progress-cell">
                    <div className="progress-bar-sm">
                      <div className="progress-fill" style={{ width: `${Math.min(100, r.attendancePct)}%` }} />
                    </div>
                    <span>{r.attendancePct}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showAiReport} onClose={closeAIReport} title={`AI Report - ${employees.find((e) => e.id === aiEmpId)?.name || ''}`} size="lg">
        {aiLoading ? (
          <div className="ai-report-loading">
            <span className="ai-spinner" aria-hidden="true"></span>
            <p>Analyzing attendance &amp; performance data...</p>
          </div>
        ) : aiError ? (
          <div className="ai-report-error" role="alert">
            <strong>Could not generate the AI report.</strong>
            <p>{aiError}</p>
          </div>
        ) : aiReport ? (
          <div className="ai-report-content">
            {aiRating !== null && (
              <div className="ai-report-rating">
                <span className="ai-rating-badge">{aiRating}/10</span>
                <span>Overall Performance Rating</span>
              </div>
            )}
            {aiSections.map((section, i) => (
              <div className="ai-report-section" key={i}>
                <h4 className="ai-report-section-title">{section.title}</h4>
                <div className="ai-report-section-text">
                  {section.lines.map((line, j) => (
                    <p key={j}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
