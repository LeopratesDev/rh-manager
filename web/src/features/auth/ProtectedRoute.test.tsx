import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { adminUser, employeeUser, renderApp, signInAs } from '../../test/renderApp';
import { readSession, saveSession } from './session';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects to login when there is no session', async () => {
    renderApp('/employees');

    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('redirects to login when the stored session has expired', async () => {
    saveSession({
      accessToken: 'old',
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      user: adminUser,
    });

    renderApp('/dashboard');

    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    expect(readSession()).toBeNull();
  });

  it('sends an employee away from admin-only pages', async () => {
    signInAs(employeeUser);

    renderApp('/employees');

    expect(await screen.findByRole('heading', { name: 'Férias' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Funcionários' })).not.toBeInTheDocument();
  });

  it('lets an admin open admin-only pages', async () => {
    signInAs(adminUser);

    renderApp('/employees');

    expect(await screen.findByRole('heading', { name: 'Funcionários' })).toBeInTheDocument();
  });

  it('clears the session and returns to login on sign out', async () => {
    signInAs(adminUser);
    renderApp('/dashboard');

    await userEvent.setup().click(await screen.findByRole('button', { name: 'Sair' }));

    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    expect(readSession()).toBeNull();
  });
});
