import { apiClient } from '../../api/client';

export type VacationStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Vacation {
  id: number;
  employeeId: number;
  employeeName: string;
  startDate: string;
  endDate: string;
  days: number;
  status: VacationStatus;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface VacationRequest {
  startDate: string;
  endDate: string;
}

export const vacationsKey = ['vacations'] as const;

export async function listMyVacations(): Promise<Vacation[]> {
  const { data } = await apiClient.get<Vacation[]>('/api/vacations/mine');
  return data;
}

export async function listVacations(status: VacationStatus | null): Promise<Vacation[]> {
  const { data } = await apiClient.get<Vacation[]>('/api/vacations', {
    params: { status: status ?? undefined },
  });
  return data;
}

export async function requestVacation(request: VacationRequest): Promise<Vacation> {
  const { data } = await apiClient.post<Vacation>('/api/vacations', request);
  return data;
}

export async function approveVacation(id: number): Promise<void> {
  await apiClient.post(`/api/vacations/${id}/approve`);
}

export async function rejectVacation(id: number, reason: string): Promise<void> {
  await apiClient.post(`/api/vacations/${id}/reject`, { reason });
}
