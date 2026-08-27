import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { isDemoMode } from '../../lib/demoMode';
import { AppLayout } from './AppLayout';

export function ProtectedRoute() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <p className="text-gray-600">...</p>
      </div>
    );
  }

  if (!session && !isDemoMode) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
