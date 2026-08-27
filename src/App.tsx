import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { isSupabaseConfigured } from './lib/supabaseClient';
import { isDemoMode } from './lib/demoMode';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { ShoppingPage } from './pages/ShoppingPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { LoginPage } from './pages/LoginPage';
import { SetupPage } from './pages/SetupPage';

function AppRoutes() {
  if (!isSupabaseConfigured && !isDemoMode) {
    return (
      <Routes>
        <Route path="*" element={<SetupPage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/tareas" element={<TasksPage />} />
        <Route path="/compras" element={<ShoppingPage />} />
        <Route path="/gastos" element={<ExpensesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
