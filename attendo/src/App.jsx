import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { useEffect } from 'react';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import EmployeeLoginPage from './pages/EmployeeLoginPage';
import EmployeePortalPage from './pages/EmployeePortalPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import AttendancePage from './pages/AttendancePage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import InstallPage from './pages/InstallPage';

function ThemeEffect() {
  const { darkMode } = useApp();
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);
  return null;
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const { user } = useAuth();
  if (isAuthenticated) return <Navigate to={user?.role === 'employee' ? '/employee-portal' : '/'} replace />;
  return children;
}

function EmployeeRoute({ children }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/employee-login" replace />;
  if (user?.role !== 'employee') return <Navigate to="/" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/employee-login" element={<PublicRoute><EmployeeLoginPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/install" element={<InstallPage />} />
      <Route path="/employee-portal" element={<EmployeeRoute><EmployeePortalPage /></EmployeeRoute>} />
      <Route path="/" element={<ProtectedRoute><AdminRoute><Layout /></AdminRoute></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="employees" element={<AdminRoute><EmployeesPage /></AdminRoute>} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <ThemeEffect />
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
