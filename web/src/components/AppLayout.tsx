import { NavLink, Outlet } from 'react-router';
import type { UserRole } from '../api/types';
import { useAuth } from '../features/auth/authContext';

const NAV_ITEMS: { to: string; label: string; roles: UserRole[] }[] = [
  { to: '/dashboard', label: 'Dashboard', roles: ['Admin'] },
  { to: '/employees', label: 'Funcionários', roles: ['Admin'] },
  { to: '/departments', label: 'Departamentos', roles: ['Admin'] },
  { to: '/vacations', label: 'Férias', roles: ['Admin', 'Employee'] },
];

export function AppLayout() {
  const { user, signOut } = useAuth();
  const items = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <span className="font-semibold text-slate-900">RH Manager</span>
          <nav className="flex flex-wrap gap-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>{user?.employeeName ?? user?.email}</span>
            <button type="button" onClick={signOut} className="btn-secondary">
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
