import { apiClient } from '../../api/client';

export const dashboardKey = ['dashboard'] as const;

export interface Absence {
  id: number;
  employeeName: string;
  departmentName: string;
  startDate: string;
  endDate: string;
  status: 'Approved' | 'Pending';
}

export interface Dashboard {
  totalActiveEmployees: number;
  pendingVacations: number;
  employeesByDepartment: {
    departmentId: number;
    departmentName: string;
    activeEmployees: number;
  }[];
  upcomingVacations: { id: number; employeeName: string; startDate: string; endDate: string }[];
  windowStart: string;
  windowEnd: string;
  absences: Absence[];
}

export async function getDashboard(): Promise<Dashboard> {
  const { data } = await apiClient.get<Dashboard>('/api/dashboard');
  return data;
}
