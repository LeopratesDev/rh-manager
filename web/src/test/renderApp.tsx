import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { App } from '../App';
import type { User } from '../api/types';
import { AuthProvider } from '../features/auth/AuthProvider';
import { saveSession } from '../features/auth/session';

export const adminUser: User = {
  id: 1,
  email: 'admin@rhmanager.dev',
  role: 'Admin',
  employeeId: null,
  employeeName: null,
};

export const employeeUser: User = {
  id: 2,
  email: 'ana.souza@rhmanager.dev',
  role: 'Employee',
  employeeId: 1,
  employeeName: 'Ana Souza',
};

export function signInAs(user: User) {
  saveSession({
    accessToken: 'test-token',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    user,
  });
}

export function renderApp(route: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
