import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adminUser, employeeUser, renderApp } from '../../test/renderApp';
import { login } from './authApi';
import { readSession } from './session';

vi.mock('./authApi', () => ({ login: vi.fn() }));

const loginMock = vi.mocked(login);

function sessionFor(user: typeof adminUser) {
  return { accessToken: 'jwt', expiresAt: new Date(Date.now() + 3_600_000).toISOString(), user };
}

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup();
  if (email) await user.type(screen.getByLabelText('E-mail'), email);
  if (password) await user.type(screen.getByLabelText('Senha'), password);
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    loginMock.mockReset();
  });

  it('shows required field errors and does not call the API when submitted empty', async () => {
    renderApp('/login');

    await fillAndSubmit('', '');

    expect(await screen.findByText('Informe o e-mail.')).toBeInTheDocument();
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('shows an invalid e-mail error for a malformed address', async () => {
    renderApp('/login');

    await fillAndSubmit('admin@', 'Admin@123');

    expect(await screen.findByText('E-mail inválido.')).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('shows a friendly message when the API answers 401', async () => {
    const response = {
      status: 401,
      data: {},
      headers: {},
      config: { headers: new AxiosHeaders() },
    };
    loginMock.mockRejectedValue(
      new AxiosError('Unauthorized', '401', undefined, undefined, response as AxiosResponse),
    );
    renderApp('/login');

    await fillAndSubmit('admin@rhmanager.dev', 'errada');

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.');
    expect(readSession()).toBeNull();
  });

  it('stores the session and sends an admin to the dashboard', async () => {
    loginMock.mockResolvedValue(sessionFor(adminUser));
    renderApp('/login');

    await fillAndSubmit('admin@rhmanager.dev', 'Admin@123');

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(loginMock.mock.calls[0][0]).toEqual({
      email: 'admin@rhmanager.dev',
      password: 'Admin@123',
    });
    expect(readSession()?.user.role).toBe('Admin');
  });

  it('sends an employee to the vacations page', async () => {
    loginMock.mockResolvedValue(sessionFor(employeeUser));
    renderApp('/login');

    await fillAndSubmit('ana.souza@rhmanager.dev', 'Colab@123');

    expect(await screen.findByRole('heading', { name: 'Férias' })).toBeInTheDocument();
  });
});
