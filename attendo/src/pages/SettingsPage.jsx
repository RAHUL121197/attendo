import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/helpers';
import { SHIFTS } from '../utils/demoData';

export default function SettingsPage() {
  const { settings, updateSettings, darkMode, toggleDarkMode, leaves, employees, updateLeaveStatus, addToast } = useApp();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState('appearance');

  const pendingLeaves = leaves.filter((l) => l.status === 'Pending');

  return (
    <div className="page-container">
      <h2>Settings</h2>

      <div className="settings-layout">
        <div className="settings-sidebar">
          <button className={`settings-nav-item ${activeTab === 'appearance' ? 'active' : ''}`} onClick={() => setActiveTab('appearance')}>Appearance</button>
          <button className={`settings-nav-item ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>System</button>
          {isAdmin && <button className={`settings-nav-item ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>Attendance</button>}
          {isAdmin && <button className={`settings-nav-item ${activeTab === 'leaves' ? 'active' : ''}`} onClick={() => setActiveTab('leaves')}>Leave Requests ({pendingLeaves.length})</button>}
          <button className={`settings-nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>Notifications</button>
        </div>

        <div className="settings-content">
          {activeTab === 'appearance' && (
            <div className="settings-section">
              <h3>Appearance</h3>
              <div className="setting-item">
                <div className="setting-info">
                  <strong>Dark Mode</strong>
                  <p>Toggle between light and dark themes</p>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="settings-section">
              <h3>System</h3>
              <div className="setting-item">
                <div className="setting-info"><strong>Application Name</strong><p>{settings.applicationName}</p></div>
              </div>
              <div className="setting-item">
                <div className="setting-info"><strong>Version</strong><p>{settings.version}</p></div>
              </div>
              <div className="setting-item">
                <div className="setting-info"><strong>Storage Type</strong><p>{settings.storageType}</p></div>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && isAdmin && (
            <div className="settings-section">
              <h3>Attendance</h3>
              <div className="settings-form">
                <div className="form-group">
                  <label>Default Shift</label>
                  <select value={settings.defaultShift} onChange={(e) => updateSettings({ defaultShift: e.target.value })}>
                    {SHIFTS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Late After Time</label>
                  <input type="time" value={settings.lateAfterTime} onChange={(e) => updateSettings({ lateAfterTime: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Working Hours</label>
                  <input type="number" value={settings.workingHours} min="1" max="12" onChange={(e) => updateSettings({ workingHours: parseInt(e.target.value) || 8 })} />
                </div>
                <button className="btn btn-primary" onClick={() => addToast('Settings saved successfully')}>Save Settings</button>
              </div>
            </div>
          )}

          {activeTab === 'leaves' && isAdmin && (
            <div className="settings-section">
              <h3>Leave Requests</h3>
              {pendingLeaves.length === 0 ? (
                <div className="empty-state-sm"><p>No pending leave requests</p></div>
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Type</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Reason</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingLeaves.map((l) => {
                        const emp = employees.find((e) => e.id === l.employeeId);
                        return (
                          <tr key={l.id}>
                            <td className="fw-600">{emp?.name || 'Unknown'}</td>
                            <td>{l.leaveType}</td>
                            <td>{formatDate(l.startDate)}</td>
                            <td>{formatDate(l.endDate)}</td>
                            <td>{l.reason || '-'}</td>
                            <td className="actions-cell">
                              <button className="btn btn-sm btn-success" onClick={() => { updateLeaveStatus(l.id, 'Approved'); addToast('Leave approved'); }}>Approve</button>
                              <button className="btn btn-sm btn-danger" onClick={() => { updateLeaveStatus(l.id, 'Rejected'); addToast('Leave rejected'); }}>Reject</button>
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

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h3>Notifications</h3>
              <div className="setting-item">
                <div className="setting-info"><strong>Attendance Notifications</strong><p>Get notified when employees check in/out</p></div>
                <label className="toggle">
                  <input type="checkbox" checked={settings.attendanceNotification} onChange={(e) => updateSettings({ attendanceNotification: e.target.checked })} />
                  <span className="toggle-slider" />
                </label>
              </div>
              <div className="setting-item">
                <div className="setting-info"><strong>Late Notifications</strong><p>Get notified when employees are late</p></div>
                <label className="toggle">
                  <input type="checkbox" checked={settings.lateNotification} onChange={(e) => updateSettings({ lateNotification: e.target.checked })} />
                  <span className="toggle-slider" />
                </label>
              </div>
              <div className="setting-item">
                <div className="setting-info"><strong>Leave Notifications</strong><p>Get notified about leave requests</p></div>
                <label className="toggle">
                  <input type="checkbox" checked={settings.leaveNotification} onChange={(e) => updateSettings({ leaveNotification: e.target.checked })} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
