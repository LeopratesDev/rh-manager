import { useState } from 'react';
import { NavLink, Outlet } from 'react-router';
import type { UserRole } from '../api/types';
import { useAuth } from '../features/auth/authContext';

const NAV_ITEMS: { to: string; label: string; roles: UserRole[] }[] = [
  { to: '/dashboard', label: 'Dashboard', roles: ['Admin'] },
  { to: '/employees', label: 'Funcionários', roles: ['Admin'] },
  { to: '/departments', label: 'Departamentos', roles: ['Admin'] },
  { to: '/vacations', label: 'Férias', roles: ['Admin', 'Employee'] },
];

function Brand() {
  return (
    <div className="px-5 py-6">
      <p className="text-lg leading-tight font-extrabold text-ouro">RH Manager</p>
      <p className="text-xs text-white/60">Gestão de pessoas e férias</p>
    </div>
  );
}

export function AppLayout() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const items = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));

  const navigation = (
    <nav aria-label="Menu principal" className="flex flex-1 flex-col gap-1 px-3">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={() => setMenuOpen(false)}
          className={({ isActive }) =>
            `rounded-md border-l-4 px-3 py-2 text-sm font-medium ${
              isActive
                ? 'border-ouro bg-white/10 text-white'
                : 'border-transparent text-white/75 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  const account = (
    <div className="border-t border-white/10 px-5 py-4 text-sm">
      <p className="truncate font-medium text-white">{user?.employeeName ?? 'RH'}</p>
      <p className="truncate text-xs text-white/60">{user?.email}</p>
      <button
        type="button"
        onClick={signOut}
        className="mt-3 text-xs font-semibold text-ouro hover:underline"
      >
        Sair
      </button>
    </div>
  );

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-60 shrink-0 flex-col bg-ctps md:sticky md:top-0 md:flex md:h-screen">
        <Brand />
        {navigation}
        {account}
      </aside>

      <header className="flex items-center justify-between bg-ctps px-4 py-3 md:hidden">
        <p className="font-extrabold text-ouro">RH Manager</p>
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-md border border-white/30 px-3 py-1 text-sm text-white"
        >
          {menuOpen ? 'Fechar' : 'Menu'}
        </button>
      </header>
      {menuOpen && (
        <div id="mobile-menu" className="flex flex-col bg-ctps-escuro pt-2 md:hidden">
          {navigation}
          {account}
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-10">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
