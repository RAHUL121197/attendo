import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { saveData, loadData, clearData, KEYS } from '../utils/storage';
import { DEMO_USERS } from '../utils/demoData';

const AuthContext = createContext(null);

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

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
