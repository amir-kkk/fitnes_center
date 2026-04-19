import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { CircularProgress, Box } from '@mui/material';

interface Props {
  children: React.ReactNode;
  requiredRole?: string;
  disallowedRoles?: string[];
}

export default function ProtectedRoute({ children, requiredRole, disallowedRoles }: Props) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  if (disallowedRoles?.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
