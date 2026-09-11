import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { saveData, loadData, KEYS } from '../utils/storage';
import { DEMO_EMPLOYEES, DEMO_USERS, DEFAULT_SETTINGS } from '../utils/demoData';
import { generateId, getCurrentDate, getCurrentTime, timeToMinutes, timeDiffHours } from '../utils/helpers';

const AppContext = createContext(null);

function getEmployeeSerial(id) {
  const match = String(id || '').match(/^(?:EMP|e)(\d+)$/i);
  return match ? Number(match[1]) : 0;
}

function getHighestEmployeeSerial(employees) {
  return employees.reduce((highest, employee) => Math.max(highest, getEmployeeSerial(employee.id)), 0);
}

function generateTemporaryPassword(existingUsers) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const usedPasswords = new Set(existingUsers.map((user) => user.password));
  let password = '';
  do {
    const values = new Uint32Array(12);
    crypto.getRandomValues(values);
    password = Array.from(values, (value) => alphabet[value % alphabet.length]).join('');
  } while (usedPasswords.has(password));
  return password;
}

function generateEmployeeEmail(name, existingUsers) {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '') || 'employee';
  const existingEmails = new Set(existingUsers.map((user) => user.email.toLowerCase()));
  let email = `${base}@attendo.com`;
  let suffix = 2;
  while (existingEmails.has(email)) {
    email = `${base}${suffix}@attendo.com`;
    suffix += 1;
  }
  return email;
}

export function AppProvider({ children }) {
  const [employees, setEmployees] = useState(() => {
    const data = loadData(KEYS.EMPLOYEES, null);
    if (!data || data.length === 0) {
      saveData(KEYS.EMPLOYEES, DEMO_EMPLOYEES);
      return DEMO_EMPLOYEES;
    }
    return data;
  });

  const [users, setUsers] = useState(() => {
    const data = loadData(KEYS.USERS, null);
    if (!data || data.length === 0) {
      saveData(KEYS.USERS, DEMO_USERS);
      return DEMO_USERS;
    }
    return data;
  });

  const [attendance, setAttendance] = useState(() => loadData(KEYS.ATTENDANCE, []));
  const [leaves, setLeaves] = useState(() => loadData(KEYS.LEAVES, []));
  const [notifications, setNotifications] = useState(() => loadData(KEYS.NOTIFICATIONS, []));
  const [settings, setSettings] = useState(() => {
    const data = loadData(KEYS.SETTINGS, null);
    return data ? { ...DEFAULT_SETTINGS, ...data } : DEFAULT_SETTINGS;
  });

  const [darkMode, setDarkMode] = useState(() => loadData(KEYS.DARK_MODE, false));
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const employeeSequenceRef = useRef(Number(loadData(KEYS.EMPLOYEE_SEQUENCE, 0)) || 0);

  useEffect(() => { saveData(KEYS.EMPLOYEES, employees); }, [employees]);
  useEffect(() => { saveData(KEYS.USERS, users); }, [users]);
  useEffect(() => { saveData(KEYS.ATTENDANCE, attendance); }, [attendance]);
  useEffect(() => { saveData(KEYS.LEAVES, leaves); }, [leaves]);
  useEffect(() => { saveData(KEYS.NOTIFICATIONS, notifications); }, [notifications]);
  useEffect(() => { saveData(KEYS.SETTINGS, settings); }, [settings]);
  useEffect(() => { saveData(KEYS.DARK_MODE, darkMode); }, [darkMode]);

  const addToast = useCallback((message, type = 'success') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addNotification = useCallback((message, type = 'info') => {
    const n = {
      id: generateId(),
      message,
      type,
      time: getCurrentTime(),
      date: getCurrentDate(),
      read: false,
    };
    setNotifications((prev) => [n, ...prev].slice(0, 50));
  }, []);

  const markNotificationRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const addEmployee = useCallback((emp) => {
    employeeSequenceRef.current = Math.max(employeeSequenceRef.current, getHighestEmployeeSerial(employees));
    let nextSerial = employeeSequenceRef.current + 1;
    let employeeId = `EMP${String(nextSerial).padStart(3, '0')}`;
    const existingIds = new Set(employees.map((employee) => employee.id.toLowerCase()));
    while (existingIds.has(employeeId.toLowerCase())) {
      nextSerial += 1;
      employeeId = `EMP${String(nextSerial).padStart(3, '0')}`;
    }
    employeeSequenceRef.current = nextSerial;
    saveData(KEYS.EMPLOYEE_SEQUENCE, nextSerial);

    const email = emp.email?.trim() || generateEmployeeEmail(emp.name, users);
    const temporaryPassword = generateTemporaryPassword(users);
    const newEmp = { ...emp, email, id: employeeId };
    setEmployees((prev) => [...prev, newEmp]);
    const newUser = {
      id: generateId(),
      name: emp.name,
      email,
      password: temporaryPassword,
      role: 'employee',
      employeeId: newEmp.id,
    };
    setUsers((prev) => [...prev, newUser]);
    addNotification(`Employee ${emp.name} added`, 'success');
    return { ...newEmp, temporaryPassword };
  }, [employees, users, addNotification]);

  const updateEmployee = useCallback((id, updates) => {
    setEmployees((prev) => prev.map((e) => e.id === id ? { ...e, ...updates } : e));
    setUsers((prev) => prev.map((u) => u.employeeId === id ? { ...u, name: updates.name || u.name, email: updates.email || u.email } : u));
    addNotification(`Employee updated`, 'info');
  }, [addNotification]);

  const deleteEmployee = useCallback((id) => {
    const emp = employees.find((e) => e.id === id);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    setUsers((prev) => prev.filter((u) => u.employeeId !== id));
    setAttendance((prev) => prev.filter((a) => a.employeeId !== id));
    addNotification(`Employee ${emp?.name || ''} deleted`, 'warning');
  }, [employees, addNotification]);

  const checkIn = useCallback((employeeId) => {
    const today = getCurrentDate();
    const now = getCurrentTime();
    const existing = attendance.find((a) => a.employeeId === employeeId && a.date === today);
    if (existing) return { success: false, error: 'Employee already checked in today' };

    const emp = employees.find((e) => e.id === employeeId);
    const lateTime = settings.lateAfterTime || '10:15';
    const status = timeToMinutes(now) > timeToMinutes(lateTime) ? 'Late' : 'Present';

    const record = {
      id: generateId(),
      employeeId,
      date: today,
      shift: emp?.shift || 'Default Shift',
      checkIn: now,
      checkOut: null,
      breakStart: null,
      breakEnd: null,
      breakDuration: 0,
      totalHours: 0,
      status,
    };
    setAttendance((prev) => [...prev, record]);
    addNotification(`${emp?.name || 'Employee'} checked in at ${now}`, 'success');
    return { success: true, record };
  }, [attendance, employees, settings, addNotification]);

  const checkOut = useCallback((employeeId) => {
    const today = getCurrentDate();
    const now = getCurrentTime();
    const record = attendance.find((a) => a.employeeId === employeeId && a.date === today);
    if (!record) return { success: false, error: 'No check-in record found for today' };
    if (record.checkOut) return { success: false, error: 'Already checked out today' };

    const breakMins = record.breakDuration || 0;
    const worked = timeDiffHours(record.checkIn, now);
    const totalHours = Math.max(0, worked - (breakMins / 60));

    setAttendance((prev) => prev.map((a) =>
      a.id === record.id ? { ...a, checkOut: now, totalHours: Math.round(totalHours * 100) / 100 } : a
    ));

    const emp = employees.find((e) => e.id === employeeId);
    addNotification(`${emp?.name || 'Employee'} checked out at ${now}`, 'info');
    return { success: true };
  }, [attendance, employees, addNotification]);

  const startBreak = useCallback((employeeId) => {
    const today = getCurrentDate();
    const now = getCurrentTime();
    const record = attendance.find((a) => a.employeeId === employeeId && a.date === today);
    if (!record) return { success: false, error: 'No check-in record found' };
    if (record.breakStart && !record.breakEnd) return { success: false, error: 'Break already started' };

    setAttendance((prev) => prev.map((a) =>
      a.id === record.id ? { ...a, breakStart: now, status: 'On Break' } : a
    ));
    const emp = employees.find((e) => e.id === employeeId);
    addNotification(`${emp?.name || 'Employee'} started break`, 'info');
    return { success: true };
  }, [attendance, employees, addNotification]);

  const endBreak = useCallback((employeeId) => {
    const today = getCurrentDate();
    const now = getCurrentTime();
    const record = attendance.find((a) => a.employeeId === employeeId && a.date === today);
    if (!record || !record.breakStart || record.breakEnd) return { success: false, error: 'No active break' };

    const breakMins = timeDiffHours(record.breakStart, now) * 60;
    const totalBreak = (record.breakDuration || 0) + breakMins;

    setAttendance((prev) => prev.map((a) =>
      a.id === record.id ? { ...a, breakEnd: now, breakDuration: Math.round(totalBreak), status: 'Present' } : a
    ));
    const emp = employees.find((e) => e.id === employeeId);
    addNotification(`${emp?.name || 'Employee'} ended break`, 'info');
    return { success: true };
  }, [attendance, employees, addNotification]);

  const requestLeave = useCallback((leave) => {
    const newLeave = { ...leave, id: generateId(), status: 'Pending' };
    setLeaves((prev) => [...prev, newLeave]);
    const emp = employees.find((e) => e.id === leave.employeeId);
    addNotification(`Leave request from ${emp?.name || 'Employee'}`, 'warning');
    return newLeave;
  }, [employees, addNotification]);

  const updateLeaveStatus = useCallback((id, status) => {
    setLeaves((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
    const leave = leaves.find((l) => l.id === id);
    const emp = employees.find((e) => e.id === leave?.employeeId);
    addNotification(`Leave ${status.toLowerCase()} for ${emp?.name || 'Employee'}`, status === 'Approved' ? 'success' : 'warning');
  }, [leaves, employees, addNotification]);

  const updateSettings = useCallback((updates) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    addToast('Settings saved successfully');
  }, [addToast]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  return (
    <AppContext.Provider value={{
      employees, attendance, leaves, notifications, settings, darkMode, toasts,
      addEmployee, updateEmployee, deleteEmployee,
      checkIn, checkOut, startBreak, endBreak,
      requestLeave, updateLeaveStatus,
      updateSettings, toggleDarkMode,
      addToast, removeToast,
      markNotificationRead, clearNotifications,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
