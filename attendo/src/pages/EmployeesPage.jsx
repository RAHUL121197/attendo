import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DEPARTMENTS, SHIFTS, DESIGNATIONS } from '../utils/demoData';
import { formatDate } from '../utils/helpers';
import { sendAppDownloadLink, buildWhatsAppUrl } from '../utils/whatsapp';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const whatsappIcon = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const emptyForm = {
  name: '', email: '', phone: '', department: 'Development',
  designation: 'Sr. Developer', shift: 'Default Shift',
  joiningDate: '', gender: 'Male', status: 'Active',
  biometricRegistered: false, aadharCardNo: '',
};

export default function EmployeesPage() {
  const { employees, addEmployee, updateEmployee, deleteEmployee, lookupEmployeeByAadhar, addToast } = useApp();
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [filterBiometric, setFilterBiometric] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [viewEmp, setViewEmp] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [aadharLookup, setAadharLookup] = useState({ key: '', status: 'idle', employee: null, message: '' });
  const normalizedAadhar = String(form.aadharCardNo || '').replace(/\D/g, '').slice(0, 12);
  const activeAadharLookup = aadharLookup.key === normalizedAadhar ? aadharLookup : {
    key: normalizedAadhar,
    status: normalizedAadhar.length === 12 ? 'loading' : normalizedAadhar ? 'invalid' : 'idle',
    employee: null,
    message: normalizedAadhar.length === 12 ? 'Checking employee records...' : normalizedAadhar ? 'Enter all 12 digits to search.' : '',
  };

  useEffect(() => {
    if (editId) return undefined;
    const value = normalizedAadhar;
    if (value.length !== 12) return undefined;
    let cancelled = false;
    lookupEmployeeByAadhar(value).then(({ employee, notFound }) => {
      if (cancelled) return;
      setAadharLookup({
        key: value,
        status: employee ? 'found' : notFound ? 'not-found' : 'idle',
        employee: employee || null,
        message: employee ? 'An employee with this Aadhar Card No. already exists.' : notFound ? 'Employee not found.' : '',
      });
    }).catch(() => {
      if (!cancelled) setAadharLookup({ key: value, status: 'error', employee: null, message: 'Unable to check the employee database. Try again.' });
    });
    return () => { cancelled = true; };
  }, [editId, normalizedAadhar, lookupEmployeeByAadhar]);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (search) {
        const q = search.toLowerCase();
        if (!e.name.toLowerCase().includes(q) && !e.email.toLowerCase().includes(q) && !e.id.toLowerCase().includes(q) && !e.department.toLowerCase().includes(q) && !e.designation.toLowerCase().includes(q)) return false;
      }
      if (filterDept && e.department !== filterDept) return false;
      if (filterStatus && e.status !== filterStatus) return false;
      if (filterShift && e.shift !== filterShift) return false;
      if (filterBiometric === 'true' && !e.biometricRegistered) return false;
      if (filterBiometric === 'false' && e.biometricRegistered) return false;
      return true;
    });
  }, [employees, search, filterDept, filterStatus, filterShift, filterBiometric]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    else if (form.email.trim()) {
      const dup = employees.find((e) => e.email === form.email && e.id !== editId);
      if (dup) errs.email = 'Email already exists';
    }
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) errs.phone = 'Invalid phone';
    if (!form.department) errs.department = 'Department is required';
    if (!form.shift) errs.shift = 'Shift is required';
    if (!editId && !/^\d{12}$/.test(form.aadharCardNo || '')) errs.aadharCardNo = 'Aadhar Card No. must contain exactly 12 digits';
    if (!editId && activeAadharLookup.status === 'found') errs.aadharCardNo = 'This Aadhar Card No. already belongs to an employee';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSendLink = (emp) => {
    const url = sendAppDownloadLink(emp, window.location.origin);
    if (url) {
      addToast(`WhatsApp download link sent to ${emp.name}`);
    } else {
      addToast('Phone number missing - cannot send', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (editId) {
        updateEmployee(editId, form);
        addToast('Employee updated successfully');
      } else {
        const newEmp = await addEmployee(form);
        addToast('Employee added successfully');
        if (buildWhatsAppUrl(newEmp, window.location.origin)) handleSendLink(newEmp);
        setCredentials({ name: newEmp.name, email: newEmp.email, employeeId: newEmp.id, password: newEmp.temporaryPassword });
      }
    } catch (error) {
      addToast(error.message || 'Unable to save employee', 'error');
      return;
    }
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
  };

  const openEdit = (emp) => {
    setForm({ ...emp });
    setEditId(emp.id);
    setShowForm(true);
    setErrors({});
    setAadharLookup({ status: 'idle', employee: null, message: '' });
  };

  const openAdd = () => {
    setForm({ ...emptyForm, joiningDate: new Date().toISOString().split('T')[0] });
    setEditId(null);
    setShowForm(true);
    setErrors({});
    setAadharLookup({ status: 'idle', employee: null, message: '' });
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteEmployee(deleteId);
      addToast('Employee deleted successfully');
      setDeleteId(null);
    }
  };

  const resetFilters = () => {
    setFilterDept('');
    setFilterStatus('');
    setFilterShift('');
    setFilterBiometric('');
    setSearch('');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Employee Management</h2>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Employee</button>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search by name, email, ID, department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <select value={filterShift} onChange={(e) => setFilterShift(e.target.value)}>
          <option value="">All Shifts</option>
          {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterBiometric} onChange={(e) => setFilterBiometric(e.target.value)}>
          <option value="">All Biometric</option>
          <option value="true">Registered</option>
          <option value="false">Pending</option>
        </select>
        <button className="btn btn-secondary" onClick={resetFilters}>Reset</button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Shift</th>
              <th>Joining Date</th>
              <th>Biometric</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="11" className="empty-cell">No employees found</td></tr>
            ) : filtered.map((emp) => (
              <tr key={emp.id}>
                <td className="mono">{emp.id.toUpperCase()}</td>
                <td className="fw-600">{emp.name}</td>
                <td>{emp.email}</td>
                <td>{emp.phone}</td>
                <td>{emp.department}</td>
                <td>{emp.designation}</td>
                <td>{emp.shift}</td>
                <td>{formatDate(emp.joiningDate)}</td>
                <td>
                  <span className={`badge ${emp.biometricRegistered ? 'badge-success' : 'badge-warning'}`}>
                    {emp.biometricRegistered ? 'Registered' : 'Pending'}
                  </span>
                </td>
                <td>
                  <span className={`badge ${emp.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                    {emp.status}
                  </span>
                </td>
                <td className="actions-cell">
                  <button className="icon-btn-sm icon-btn-whatsapp" title="Send App Download Link via WhatsApp" onClick={() => handleSendLink(emp)}>
                    {whatsappIcon}
                  </button>
                  <button className="icon-btn-sm" title="View" onClick={() => setViewEmp(emp)}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                  </button>
                  <button className="icon-btn-sm" title="Edit" onClick={() => openEdit(emp)}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                  </button>
                  <button className="icon-btn-sm icon-btn-danger" title="Delete" onClick={() => setDeleteId(emp.id)}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditId(null); }} title={editId ? 'Edit Employee' : 'Add Employee'} size="lg">
        <form className="emp-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group form-group-wide">
              <label htmlFor="employee-aadhar">Aadhar Card No. {editId ? '' : '*'}</label>
              <input
                id="employee-aadhar"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={12}
                placeholder="Enter 12-digit Aadhar number"
                value={form.aadharCardNo || ''}
                onChange={(e) => setForm({ ...form, aadharCardNo: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                aria-describedby="aadhar-lookup-status"
              />
              {errors.aadharCardNo && <span className="form-error">{errors.aadharCardNo}</span>}
              {!errors.aadharCardNo && activeAadharLookup.message && (
                <span id="aadhar-lookup-status" className={`aadhar-lookup-message ${activeAadharLookup.status}`} role="status">{activeAadharLookup.message}</span>
              )}
            </div>
            {activeAadharLookup.employee && (
              <div className="aadhar-match-panel">
                <div className="aadhar-match-heading">
                  <strong>Saved employee details</strong>
                  <span className="badge badge-warning">Duplicate record</span>
                </div>
                <div className="aadhar-match-grid">
                  <span><small>Employee Name</small>{activeAadharLookup.employee.name}</span>
                  <span><small>Mobile Number</small>{activeAadharLookup.employee.phone || 'Not available'}</span>
                  <span><small>Email</small>{activeAadharLookup.employee.email || 'Not available'}</span>
                  <span><small>Department / Designation</small>{[activeAadharLookup.employee.department, activeAadharLookup.employee.designation].filter(Boolean).join(' / ') || 'Not available'}</span>
                  <span><small>Employee ID</small>{activeAadharLookup.employee.employeeCode || activeAadharLookup.employee.id}</span>
                </div>
                <p className="aadhar-match-note">This record cannot be added again.</p>
              </div>
            )}
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label>Email ID</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label>Phone *</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                pattern="[0-9]{10}"
                placeholder="10-digit mobile number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              />
              {errors.phone && <span className="form-error">{errors.phone}</span>}
            </div>
            <div className="form-group">
              <label>Department *</label>
              <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Designation</label>
              <select value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })}>
                {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Shift *</label>
              <select value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })}>
                {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Joining Date</label>
              <input type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="form-group">
              <label>Biometric Registered</label>
              <select value={form.biometricRegistered ? 'true' : 'false'} onChange={(e) => setForm({ ...form, biometricRegistered: e.target.value === 'true' })}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Add'} Employee</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!credentials} onClose={() => setCredentials(null)} title="Employee Login Credentials" size="sm">
        {credentials && (
          <div className="credential-panel">
            <p>Share these temporary credentials with {credentials.name}. They can use them at the Employee Portal.</p>
            <div className="credential-row"><strong>Email ID</strong><code>{credentials.email}</code></div>
            <div className="credential-row"><strong>Employee ID</strong><code>{credentials.employeeId}</code></div>
            <div className="credential-row"><strong>Temporary Password</strong><code>{credentials.password}</code></div>
            <button className="btn btn-primary btn-block" onClick={() => setCredentials(null)}>Done</button>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!viewEmp} onClose={() => setViewEmp(null)} title="Employee Details" size="md">
        {viewEmp && (
          <div className="emp-details">
            <div className="emp-detail-header">
              <div className="emp-avatar-lg">{viewEmp.name.split(' ').map((w) => w[0]).join('').toUpperCase()}</div>
              <div>
                <h3>{viewEmp.name}</h3>
                <p>{viewEmp.designation} - {viewEmp.department}</p>
              </div>
            </div>
            <div className="detail-grid">
              <div><strong>ID:</strong> {viewEmp.id.toUpperCase()}</div>
              <div><strong>Email:</strong> {viewEmp.email}</div>
              <div><strong>Phone:</strong> {viewEmp.phone}</div>
              <div><strong>Shift:</strong> {viewEmp.shift}</div>
              <div><strong>Joining Date:</strong> {formatDate(viewEmp.joiningDate)}</div>
              <div><strong>Gender:</strong> {viewEmp.gender}</div>
              <div><strong>Status:</strong> <span className={`badge ${viewEmp.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>{viewEmp.status}</span></div>
              <div><strong>Biometric:</strong> <span className={`badge ${viewEmp.biometricRegistered ? 'badge-success' : 'badge-warning'}`}>{viewEmp.biometricRegistered ? 'Registered' : 'Pending'}</span></div>
            </div>
            <div className="detail-actions">
              <button className="btn btn-whatsapp" onClick={() => handleSendLink(viewEmp)}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                Send Download Link via WhatsApp
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Employee"
        message="Are you sure you want to delete this employee? This action cannot be undone."
      />
    </div>
  );
}
