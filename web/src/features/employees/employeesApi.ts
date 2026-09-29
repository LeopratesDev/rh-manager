import { apiClient } from '../../api/client';
import type {
  Employee,
  EmployeeListItem,
  EmployeeStatus,
  PagedResult,
  SaveEmployee,
} from '../../api/types';

export interface EmployeeFilters {
  page: number;
  pageSize: number;
  search: string;
  departmentId: number | null;
  status: EmployeeStatus | null;
}

export const employeesKey = ['employees'] as const;

export async function listEmployees(
  filters: EmployeeFilters,
): Promise<PagedResult<EmployeeListItem>> {
  const { data } = await apiClient.get<PagedResult<EmployeeListItem>>('/api/employees', {
    params: {
      page: filters.page,
      pageSize: filters.pageSize,
      search: filters.search || undefined,
      departmentId: filters.departmentId ?? undefined,
      status: filters.status ?? undefined,
    },
  });
  return data;
}

export async function getEmployee(id: number): Promise<Employee> {
  const { data } = await apiClient.get<Employee>(`/api/employees/${id}`);
  return data;
}

export async function createEmployee(employee: SaveEmployee): Promise<Employee> {
  const { data } = await apiClient.post<Employee>('/api/employees', employee);
  return data;
}

export async function updateEmployee(id: number, employee: SaveEmployee): Promise<void> {
  await apiClient.put(`/api/employees/${id}`, employee);
}

export async function deactivateEmployee(id: number): Promise<void> {
  await apiClient.delete(`/api/employees/${id}`);
}
