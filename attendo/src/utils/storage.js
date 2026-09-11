const KEYS = {
  USER: 'attendoUser',
  USERS: 'attendoUsers',
  EMPLOYEES: 'attendoEmployees',
  EMPLOYEE_SEQUENCE: 'attendoEmployeeSequence',
  ATTENDANCE: 'attendoAttendance',
  LEAVES: 'attendoLeaves',
  NOTIFICATIONS: 'attendoNotifications',
  SETTINGS: 'attendoSettings',
  DARK_MODE: 'attendoDarkMode',
  EMPLOYEE_LANGUAGE: 'attendoEmployeeLanguage',
  EMPLOYEE_DOCUMENTS: 'attendoEmployeeDocuments',
  EMPLOYEE_LOANS: 'attendoEmployeeLoans',
  EMPLOYEE_ARREARS: 'attendoEmployeeArrears',
  EMPLOYEE_SHIFTS: 'attendoEmployeeShifts',
};

export function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function loadData(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

export function clearData(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // silent
  }
}

export { KEYS };
