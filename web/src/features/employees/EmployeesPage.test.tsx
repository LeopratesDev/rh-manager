import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EmployeeListItem, PagedResult } from '../../api/types';
import { adminUser, renderApp, signInAs } from '../../test/renderApp';
import { listDepartments } from '../departments/departmentsApi';
import { listEmployees } from './employeesApi';

vi.mock('./employeesApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./employeesApi')>()),
  listEmployees: vi.fn(),
}));
vi.mock('../departments/departmentsApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../departments/departmentsApi')>()),
  listDepartments: vi.fn(),
}));

const listEmployeesMock = vi.mocked(listEmployees);

const ana: EmployeeListItem = {
  id: 1,
  name: 'Ana Souza',
  email: 'ana.souza@rhmanager.dev',
  maskedCpf: '***.018.159-**',
  position: 'Desenvolvedora Back-end',
  hireDate: '2021-03-01',
  status: 'Active',
  departmentId: 1,
  departmentName: 'Tecnologia',
};

function page(items: EmployeeListItem[], totalItems = items.length): PagedResult<EmployeeListItem> {
  return { items, page: 1, pageSize: 10, totalItems, totalPages: Math.ceil(totalItems / 10) };
}

describe('EmployeesPage', () => {
  beforeEach(() => {
    localStorage.clear();
    signInAs(adminUser);
    listEmployeesMock.mockReset();
    vi.mocked(listDepartments).mockResolvedValue([{ id: 1, name: 'Tecnologia', employeeCount: 1 }]);
  });

  it('lists employees with masked CPF, no salary and formatted date', async () => {
    listEmployeesMock.mockResolvedValue(page([ana], 21));

    renderApp('/employees');

    expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByText('***.018.159-**')).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Salário' })).not.toBeInTheDocument();
    expect(screen.getByText('01/03/2021')).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
  });

  it('shows an empty state when no employee matches', async () => {
    listEmployeesMock.mockResolvedValue(page([]));

    renderApp('/employees');

    expect(
      await screen.findByText('Nenhum funcionário encontrado com esses filtros.'),
    ).toBeInTheDocument();
  });

  it('shows an error state with retry when the API fails', async () => {
    listEmployeesMock
      .mockRejectedValueOnce(new AxiosError('Network Error'))
      .mockResolvedValue(page([ana]));

    renderApp('/employees');

    expect(await screen.findByText('Não foi possível conectar à API.')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
  });

  it('sends search and filters to the API and resets to the first page', async () => {
    listEmployeesMock.mockResolvedValue(page([ana], 21));
    const user = userEvent.setup();
    renderApp('/employees');
    await screen.findByText('Ana Souza');
    await user.click(screen.getByRole('button', { name: 'Próxima' }));
    await vi.waitFor(() =>
      expect(listEmployeesMock).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })),
    );

    await user.type(screen.getByLabelText('Buscar por nome'), 'ana');
    await user.selectOptions(screen.getByLabelText('Filtrar por departamento'), 'Tecnologia');
    await user.selectOptions(screen.getByLabelText('Filtrar por status'), 'Inactive');

    await vi.waitFor(() =>
      expect(listEmployeesMock).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 10,
        search: 'ana',
        departmentId: 1,
        status: 'Inactive',
      }),
    );
  });
});
