import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adminUser, renderApp, signInAs } from '../../test/renderApp';
import { getDashboard } from './dashboardApi';

vi.mock('./dashboardApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./dashboardApi')>()),
  getDashboard: vi.fn(),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    localStorage.clear();
    signInAs(adminUser);
  });

  it('shows totals, headcount per department and upcoming vacations', async () => {
    vi.mocked(getDashboard).mockResolvedValue({
      totalActiveEmployees: 18,
      pendingVacations: 3,
      employeesByDepartment: [
        { departmentId: 1, departmentName: 'Tecnologia', activeEmployees: 7 },
        { departmentId: 2, departmentName: 'Financeiro', activeEmployees: 11 },
      ],
      upcomingVacations: [
        { id: 5, employeeName: 'Ana Souza', startDate: '2026-11-02', endDate: '2026-11-11' },
      ],
      windowStart: '2026-10-01',
      windowEnd: '2026-10-28',
      absences: [],
    });

    renderApp('/dashboard');

    const activeCard = (await screen.findByText('Funcionários ativos')).closest('a')!;
    expect(within(activeCard).getByText('18')).toBeInTheDocument();
    expect(
      within(screen.getByText('Férias pendentes').closest('a')!).getByText('3'),
    ).toBeInTheDocument();
    expect(screen.getByText('Tecnologia')).toBeInTheDocument();
    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByText('02/11/2026 a 11/11/2026')).toBeInTheDocument();
  });

  it('shows an empty message when there are no upcoming vacations', async () => {
    vi.mocked(getDashboard).mockResolvedValue({
      totalActiveEmployees: 0,
      pendingVacations: 0,
      employeesByDepartment: [],
      upcomingVacations: [],
      windowStart: '2026-10-01',
      windowEnd: '2026-10-28',
      absences: [],
    });

    renderApp('/dashboard');

    expect(
      await screen.findByText('Nenhuma férias aprovada nos próximos dias.'),
    ).toBeInTheDocument();
  });
});
