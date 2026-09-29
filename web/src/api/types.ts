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

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface Department {
  id: number;
  name: string;
  employeeCount: number;
}

export type EmployeeStatus = 'Active' | 'Inactive';

export interface Employee {
  id: number;
  name: string;
  email: string;
  cpf: string;
  position: string;
  salary: number;
  hireDate: string;
  status: EmployeeStatus;
  departmentId: number;
  departmentName: string;
}

export interface EmployeeListItem {
  id: number;
  name: string;
  email: string;
  maskedCpf: string;
  position: string;
  hireDate: string;
  status: EmployeeStatus;
  departmentId: number;
  departmentName: string;
}

export interface SaveEmployee {
  name: string;
  email: string;
  cpf: string;
  position: string;
  salary: number;
  hireDate: string;
  departmentId: number;
  status: EmployeeStatus;
}
