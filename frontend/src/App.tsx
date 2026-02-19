import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MembershipsPage from './pages/MembershipsPage';
import TrainingsPage from './pages/TrainingsPage';
import ProfilePage from './pages/ProfilePage';
import ProgressPage from './pages/ProgressPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminCoachesPage from './pages/admin/AdminCoachesPage';
import AdminMembershipsPage from './pages/admin/AdminMembershipsPage';
import AdminTrainingsPage from './pages/admin/AdminTrainingsPage';
import AdminPurchasesPage from './pages/admin/AdminPurchasesPage';

export default function App() {
  const loadUser = useAuthStore((s) => s.loadUser);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <Routes>
      {/* Публичные и пользовательские маршруты */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/memberships" element={<MembershipsPage />} />
        <Route path="/trainings" element={<TrainingsPage />} />
        <Route path="/profile" element={
          <ProtectedRoute><ProfilePage /></ProtectedRoute>
        } />
        <Route path="/progress" element={
          <ProtectedRoute><ProgressPage /></ProtectedRoute>
        } />
      </Route>

      {/* Админ-панель */}
      <Route element={
        <ProtectedRoute requiredRole="Admin"><AdminLayout /></ProtectedRoute>
      }>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/coaches" element={<AdminCoachesPage />} />
        <Route path="/admin/memberships" element={<AdminMembershipsPage />} />
        <Route path="/admin/trainings" element={<AdminTrainingsPage />} />
        <Route path="/admin/purchases" element={<AdminPurchasesPage />} />
      </Route>
    </Routes>
  );
}
