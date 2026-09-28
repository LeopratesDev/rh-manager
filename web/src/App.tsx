import { Navigate, Route, Routes } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { PageHeader } from './components/PageHeader';
import { LoginPage } from './features/auth/LoginPage';
import { ProtectedRoute } from './features/auth/ProtectedRoute';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route element={<ProtectedRoute roles={['Admin']} />}>
            <Route path="/dashboard" element={<PageHeader title="Dashboard" />} />
            <Route path="/employees" element={<PageHeader title="Funcionários" />} />
            <Route path="/departments" element={<PageHeader title="Departamentos" />} />
          </Route>
          <Route path="/vacations" element={<PageHeader title="Férias" />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
