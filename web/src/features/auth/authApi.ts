import { apiClient, LOGIN_URL } from '../../api/client';
import type { LoginResponse } from '../../api/types';

export interface Credentials {
  email: string;
  password: string;
}

export async function login(credentials: Credentials): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>(LOGIN_URL, credentials);
  return data;
}
