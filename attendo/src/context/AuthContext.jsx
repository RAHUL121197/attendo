import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { saveData, loadData, clearData, KEYS } from '../utils/storage';
import { DEMO_USERS } from '../utils/demoData';

const AuthContext = createContext(null);

function generateTemporaryPassword(users) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const usedPasswords = new Set(users.map((item) => item.password));
  let password = '';
  do {
    const values = new Uint32Array(12);
    crypto.getRandomValues(values);
    password = Array.from(values, (value) => alphabet[value % alphabet.length]).join('');
  } while (usedPasswords.has(password));
  return password;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadData(KEYS.USER, null));

  useEffect(() => {
    if (user) {
      saveData(KEYS.USER, user);
    }
  }, [user]);

  const login = useCallback((identifier, password, role) => {
    const users = loadData(KEYS.USERS, DEMO_USERS);
    const found = users.find(
      (u) => (role === 'employee'
        ? (u.employeeId?.toLowerCase() === identifier.trim().toLowerCase() || u.email?.toLowerCase() === identifier.trim().toLowerCase())
        : u.email.toLowerCase() === identifier.trim().toLowerCase())
        && u.password === password && u.role === role
    );
    if (found) {
      const userData = { id: found.id, name: found.name, email: found.email, role: found.role, employeeId: found.employeeId };
      setUser(userData);
      saveData(KEYS.USER, userData);
      return { success: true, user: userData };
    }
    return { success: false, error: 'Invalid email, password, or role' };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    clearData(KEYS.USER);
  }, []);

  const changePassword = useCallback((currentPassword, newPassword) => {
    if (!user) return { success: false, error: 'You must be logged in' };
    if (!newPassword || newPassword.length < 8) return { success: false, error: 'Password must be at least 8 characters' };
    const users = loadData(KEYS.USERS, DEMO_USERS);
    const index = users.findIndex((item) => item.id === user.id);
    if (index < 0 || users[index].password !== currentPassword) return { success: false, error: 'Current password is incorrect' };
    users[index] = { ...users[index], password: newPassword };
    saveData(KEYS.USERS, users);
    return { success: true };
  }, [user]);

  const resetPassword = useCallback((identifier, role) => {
    const users = loadData(KEYS.USERS, DEMO_USERS);
    const normalized = identifier.trim().toLowerCase();
    const index = users.findIndex((item) => item.role === role && (item.email?.toLowerCase() === normalized || item.employeeId?.toLowerCase() === normalized));
    if (index < 0) return { success: false, error: 'No account found for those details' };
    const temporaryPassword = generateTemporaryPassword(users);
    users[index] = { ...users[index], password: temporaryPassword };
    saveData(KEYS.USERS, users);
    return { success: true, email: users[index].email, employeeId: users[index].employeeId, temporaryPassword };
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, changePassword, resetPassword, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
