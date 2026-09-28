import { apiClient } from '../../api/client';
import type { Department } from '../../api/types';

export const departmentsKey = ['departments'] as const;

export async function listDepartments(): Promise<Department[]> {
  const { data } = await apiClient.get<Department[]>('/api/departments');
  return data;
}

export async function createDepartment(name: string): Promise<Department> {
  const { data } = await apiClient.post<Department>('/api/departments', { name });
  return data;
}

export async function updateDepartment(id: number, name: string): Promise<void> {
  await apiClient.put(`/api/departments/${id}`, { name });
}

export async function deleteDepartment(id: number): Promise<void> {
  await apiClient.delete(`/api/departments/${id}`);
}
