import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MembershipsPage from './pages/MembershipsPage';
import TrainingsPage from './pages/TrainingsPage';
import PersonalWorkoutsPage from './pages/PersonalWorkoutsPage';
import ProfilePage from './pages/ProfilePage';
import ProgressPage from './pages/ProgressPage';
import TrainerSchedulePage from './pages/TrainerSchedulePage';
import TrainerClientProgressPage from './pages/TrainerClientProgressPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminCoachesPage from './pages/admin/AdminCoachesPage';
import AdminMembershipsPage from './pages/admin/AdminMembershipsPage';
import AdminTrainingsPage from './pages/admin/AdminTrainingsPage';
import AdminPurchasesPage from './pages/admin/AdminPurchasesPage';
import AdminPersonalWorkoutsPage from './pages/admin/AdminPersonalWorkoutsPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';
import AdminClientsPage from './pages/admin/AdminClientsPage';
import AdminFinancesPage from './pages/admin/AdminFinancesPage';

function AdminEntryRoute() {
  const role = useAuthStore((s) => s.user?.role);
  if (role === 'Manager') return <Navigate to="/admin/clients" replace />;
  if (role === 'Admin') return <AdminDashboard />;
  return <Navigate to="/" replace />;
}

function HomeEntryRoute() {
  const role = useAuthStore((s) => s.user?.role);
  if (role === 'Manager') return <Navigate to="/admin/clients" replace />;
  return <HomePage />;
}

export default function App() {
  const loadUser = useAuthStore((s) => s.loadUser);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <Routes>
      {/* Публичные и пользовательские маршруты */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomeEntryRoute />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/memberships" element={<MembershipsPage />} />
        <Route path="/trainings" element={<TrainingsPage />} />
        <Route path="/personal-workouts" element={
          <ProtectedRoute><PersonalWorkoutsPage /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><ProfilePage /></ProtectedRoute>
        } />
        <Route path="/progress" element={
          <ProtectedRoute disallowedRoles={['Trainer']}><ProgressPage /></ProtectedRoute>
        } />
        <Route path="/trainer/schedule" element={
          <ProtectedRoute requiredRole="Trainer"><TrainerSchedulePage /></ProtectedRoute>
        } />
        <Route path="/trainer/client/:id" element={
          <ProtectedRoute requiredRole="Trainer"><TrainerClientProgressPage /></ProtectedRoute>
        } />
      </Route>

      {/* Админ-панель */}
      <Route element={
        <ProtectedRoute requiredRoles={['Admin', 'Manager']}><AdminLayout /></ProtectedRoute>
      }>
        <Route path="/admin" element={<AdminEntryRoute />} />
        <Route path="/admin/users" element={
          <ProtectedRoute requiredRole="Admin"><AdminUsersPage /></ProtectedRoute>
        } />
        <Route path="/admin/clients" element={
          <ProtectedRoute requiredRole="Manager"><AdminClientsPage /></ProtectedRoute>
        } />
        <Route path="/admin/audit-logs" element={
          <ProtectedRoute requiredRole="Admin"><AdminAuditLogsPage /></ProtectedRoute>
        } />
        <Route path="/admin/coaches" element={
          <ProtectedRoute requiredRole="Manager"><AdminCoachesPage /></ProtectedRoute>
        } />
        <Route path="/admin/memberships" element={
          <ProtectedRoute requiredRole="Manager"><AdminMembershipsPage /></ProtectedRoute>
        } />
        <Route path="/admin/trainings" element={
          <ProtectedRoute requiredRole="Manager"><AdminTrainingsPage /></ProtectedRoute>
        } />
        <Route path="/admin/purchases" element={
          <ProtectedRoute requiredRole="Manager"><AdminPurchasesPage /></ProtectedRoute>
        } />
        <Route path="/admin/finances" element={
          <ProtectedRoute requiredRole="Manager"><AdminFinancesPage /></ProtectedRoute>
        } />
        <Route path="/admin/personal-workouts" element={
          <ProtectedRoute requiredRole="Manager"><AdminPersonalWorkoutsPage /></ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}
