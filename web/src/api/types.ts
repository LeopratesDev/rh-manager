export type UserRole = 'Admin' | 'Employee';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  employeeId: number | null;
  employeeName: string | null;
}

export interface LoginResponse {
  accessToken: string;
  expiresAt: string;
  user: User;
}

export interface ProblemDetails {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string[]>;
}
