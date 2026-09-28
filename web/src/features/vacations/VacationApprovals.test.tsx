import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adminUser, renderApp, signInAs } from '../../test/renderApp';
import { approveVacation, listVacations, rejectVacation, type Vacation } from './vacationsApi';

vi.mock('./vacationsApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./vacationsApi')>()),
  listVacations: vi.fn(),
  approveVacation: vi.fn(),
  rejectVacation: vi.fn(),
}));

const pending: Vacation = {
  id: 7,
  employeeId: 1,
  employeeName: 'Ana Souza',
  startDate: '2026-11-02',
  endDate: '2026-11-11',
  days: 10,
  status: 'Pending',
  rejectionReason: null,
  createdAt: '2026-09-28T10:00:00',
  reviewedAt: null,
};

describe('VacationApprovals', () => {
  beforeEach(() => {
    localStorage.clear();
    signInAs(adminUser);
    vi.mocked(listVacations).mockReset().mockResolvedValue([pending]);
    vi.mocked(approveVacation).mockReset().mockResolvedValue();
    vi.mocked(rejectVacation).mockReset().mockResolvedValue();
  });

  it('loads pending requests by default and shows the period', async () => {
    renderApp('/vacations');

    expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByText('02/11/2026 a 11/11/2026 (10 dias)')).toBeInTheDocument();
    expect(listVacations).toHaveBeenCalledWith('Pending');
  });

  it('approves a request', async () => {
    renderApp('/vacations');

    await userEvent.setup().click(await screen.findByRole('button', { name: 'Aprovar' }));

    await vi.waitFor(() => expect(approveVacation).toHaveBeenCalledWith(7, expect.anything()));
  });

  it('does not reject without a reason', async () => {
    const user = userEvent.setup();
    renderApp('/vacations');

    await user.click(await screen.findByRole('button', { name: 'Rejeitar' }));
    await user.type(screen.getByLabelText('Motivo da rejeição'), '   ');
    await user.click(screen.getByRole('button', { name: 'Confirmar rejeição' }));

    expect(await screen.findByText('Informe o motivo da rejeição.')).toBeInTheDocument();
    expect(rejectVacation).not.toHaveBeenCalled();
  });

  it('rejects with the trimmed reason', async () => {
    const user = userEvent.setup();
    renderApp('/vacations');

    await user.click(await screen.findByRole('button', { name: 'Rejeitar' }));
    await user.type(screen.getByLabelText('Motivo da rejeição'), '  Fechamento do trimestre ');
    await user.click(screen.getByRole('button', { name: 'Confirmar rejeição' }));

    await vi.waitFor(() =>
      expect(rejectVacation).toHaveBeenCalledWith(7, 'Fechamento do trimestre'),
    );
  });
});
