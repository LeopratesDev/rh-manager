import { Navigate, Outlet, useLocation } from 'react-router';
import type { UserRole } from '../../api/types';
import { homePathFor, useAuth } from './authContext';

interface ProtectedRouteProps {
  roles?: UserRole[];
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homePathFor(user)} replace />;
  }

  return <Outlet />;
}
