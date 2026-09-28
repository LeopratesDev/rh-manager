import { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { saveSession } from '../features/auth/session';
import { adminUser } from '../test/renderApp';
import { apiClient, LOGIN_URL, setUnauthorizedHandler } from './client';

function respondWith(status: number) {
  apiClient.defaults.adapter = (config: InternalAxiosRequestConfig) =>
    status < 400
      ? Promise.resolve({ status, statusText: '', data: {}, headers: {}, config })
      : Promise.reject({
          isAxiosError: true,
          config,
          response: { status, data: {}, headers: {}, config },
        });
}

describe('apiClient', () => {
  const onUnauthorized = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    onUnauthorized.mockReset();
    setUnauthorizedHandler(onUnauthorized);
  });

  afterEach(() => {
    apiClient.defaults.adapter = undefined;
  });

  it('sends the stored token as a bearer header', async () => {
    saveSession({
      accessToken: 'abc',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      user: adminUser,
    });
    respondWith(200);

    const response = await apiClient.get('/api/employees');

    expect(AxiosHeaders.from(response.config.headers).get('Authorization')).toBe('Bearer abc');
  });

  it('calls the unauthorized handler when an API call returns 401', async () => {
    respondWith(401);

    await expect(apiClient.get('/api/employees')).rejects.toBeDefined();

    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('does not treat a failed login as an expired session', async () => {
    respondWith(401);

    await expect(apiClient.post(LOGIN_URL, {})).rejects.toBeDefined();

    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
