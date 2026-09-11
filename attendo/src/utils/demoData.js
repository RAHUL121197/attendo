export const DEMO_USERS = [
  { id: 'u1', name: 'Admin User', email: 'admin@attendo.com', password: '123456', role: 'admin', employeeId: null },
  { id: 'u2', name: 'Rahul Patel', email: 'rahul@attendo.com', password: '123456', role: 'employee', employeeId: 'e1' },
  { id: 'u3', name: 'Priya Shah', email: 'priya@attendo.com', password: '123456', role: 'employee', employeeId: 'e2' },
  { id: 'u4', name: 'Amit Mehta', email: 'amit@attendo.com', password: '123456', role: 'employee', employeeId: 'e3' },
  { id: 'u5', name: 'Neha Desai', email: 'neha@attendo.com', password: '123456', role: 'employee', employeeId: 'e4' },
];

export const DEMO_EMPLOYEES = [
  { id: 'e1', name: 'Rahul Patel', email: 'rahul@attendo.com', phone: '9876543210', department: 'Development', designation: 'Sr. Developer', shift: '8:00 AM TO 6:00 PM', joiningDate: '2022-03-15', gender: 'Male', status: 'Active', biometricRegistered: true },
  { id: 'e2', name: 'Priya Shah', email: 'priya@attendo.com', phone: '9876543211', department: 'Design', designation: 'UI/UX Designer', shift: '9:30 TO 6:00', joiningDate: '2022-06-01', gender: 'Female', status: 'Active', biometricRegistered: true },
  { id: 'e3', name: 'Amit Mehta', email: 'amit@attendo.com', phone: '9876543212', department: 'Marketing', designation: 'Marketing Manager', shift: 'Default Shift', joiningDate: '2021-11-20', gender: 'Male', status: 'Active', biometricRegistered: false },
  { id: 'e4', name: 'Neha Desai', email: 'neha@attendo.com', phone: '9876543213', department: 'HR', designation: 'HR Manager', shift: '8:00 AM TO 6:00 PM', joiningDate: '2021-08-10', gender: 'Female', status: 'Active', biometricRegistered: true },
  { id: 'e5', name: 'Manish Patel', email: 'manish@attendo.com', phone: '9876543214', department: 'Finance', designation: 'Accountant', shift: '9:30 TO 6:00', joiningDate: '2023-01-05', gender: 'Male', status: 'Active', biometricRegistered: false },
  { id: 'e6', name: 'Kiran Shah', email: 'kiran@attendo.com', phone: '9876543215', department: 'Development', designation: 'Jr. Developer', shift: '8:00 AM TO 6:00 PM', joiningDate: '2023-07-12', gender: 'Male', status: 'Active', biometricRegistered: false },
  { id: 'e7', name: 'Jay Mehta', email: 'jay@attendo.com', phone: '9876543216', department: 'Office', designation: 'Office Admin', shift: 'Open Shift', joiningDate: '2022-09-01', gender: 'Male', status: 'Active', biometricRegistered: false },
  { id: 'e8', name: 'Pooja Desai', email: 'pooja@attendo.com', phone: '9876543217', department: 'Accounts', designation: 'Accounts Executive', shift: 'Default Shift', joiningDate: '2023-04-18', gender: 'Female', status: 'Active', biometricRegistered: true },
];

export const SHIFTS = [
  'Open Shift',
  '8:00 AM TO 6:00 PM',
  '9:30 TO 6:00',
  'Default Shift',
];

export const DEPARTMENTS = [
  'Development',
  'Design',
  'HR',
  'Marketing',
  'Finance',
  'Accounts',
  'Office',
  'Other',
];

export const DESIGNATIONS = [
  'Sr. Developer',
  'Jr. Developer',
  'UI/UX Designer',
  'Graphic Designer',
  'Marketing Manager',
  'Marketing Executive',
  'HR Manager',
  'HR Executive',
  'Accountant',
  'Accounts Executive',
  'Office Admin',
  'Project Manager',
  'Team Lead',
  'Intern',
];

export const LEAVE_TYPES = [
  'Sick Leave',
  'Casual Leave',
  'Paid Leave',
  'Unpaid Leave',
];

export const DEFAULT_SETTINGS = {
  applicationName: 'Attendo',
  version: '1.0.0',
  storageType: 'localStorage',
  defaultShift: 'Default Shift',
  lateAfterTime: '10:15',
  workingHours: 8,
  attendanceNotification: true,
  lateNotification: true,
  leaveNotification: true,
};
