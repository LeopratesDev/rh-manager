import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import type { Department, SaveEmployee } from '../../api/types';
import { EmployeeForm } from './EmployeeForm';

const departments: Department[] = [
  { id: 1, name: 'Tecnologia', employeeCount: 7 },
  { id: 2, name: 'Financeiro', employeeCount: 6 },
];

function renderForm(
  onSubmit = vi.fn<(employee: SaveEmployee) => Promise<void>>().mockResolvedValue(),
) {
  render(<EmployeeForm departments={departments} submitLabel="Cadastrar" onSubmit={onSubmit} />);
  return { onSubmit, user: userEvent.setup() };
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nome'), '  Joana Silva ');
  await user.type(screen.getByLabelText('E-mail'), 'joana.silva@empresa.com');
  await user.type(screen.getByLabelText('CPF'), '526.018.159-06');
  await user.type(screen.getByLabelText('Cargo'), 'Analista');
  await user.type(screen.getByLabelText('Salário (R$)'), '4500.50');
  await user.type(screen.getByLabelText('Data de admissão'), '2024-03-15');
  await user.selectOptions(screen.getByLabelText('Departamento'), 'Financeiro');
}

describe('EmployeeForm', () => {
  it('shows an error for every required field and does not submit when empty', async () => {
    const { onSubmit, user } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByText('Informe o nome.')).toBeInTheDocument();
    expect(screen.getByText('Informe o e-mail.')).toBeInTheDocument();
    expect(screen.getByText('CPF inválido.')).toBeInTheDocument();
    expect(screen.getByText('Informe o cargo.')).toBeInTheDocument();
    expect(screen.getByText('Informe o salário.')).toBeInTheDocument();
    expect(screen.getByText('Informe a data de admissão.')).toBeInTheDocument();
    expect(screen.getByText('Selecione o departamento.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects a CPF with wrong check digits', async () => {
    const { onSubmit, user } = renderForm();
    await fillValidForm(user);
    await user.clear(screen.getByLabelText('CPF'));
    await user.type(screen.getByLabelText('CPF'), '123.456.789-00');

    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByText('CPF inválido.')).toBeInTheDocument();
    expect(screen.getByLabelText('CPF')).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects a malformed e-mail and a zero salary', async () => {
    const { onSubmit, user } = renderForm();
    await fillValidForm(user);
    await user.clear(screen.getByLabelText('E-mail'));
    await user.type(screen.getByLabelText('E-mail'), 'joana@');
    await user.clear(screen.getByLabelText('Salário (R$)'));
    await user.type(screen.getByLabelText('Salário (R$)'), '0');

    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByText('E-mail inválido.')).toBeInTheDocument();
    expect(screen.getByText('O salário deve ser maior que zero.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits trimmed values, CPF digits only and numeric ids', async () => {
    const { onSubmit, user } = renderForm();
    await fillValidForm(user);

    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0][0]).toEqual({
      name: 'Joana Silva',
      email: 'joana.silva@empresa.com',
      cpf: '52601815906',
      position: 'Analista',
      salary: 4500.5,
      hireDate: '2024-03-15',
      departmentId: 2,
      status: 'Active',
    });
  });

  it('shows field errors returned by the API next to the matching input', async () => {
    const response = {
      status: 400,
      data: {
        title: 'Um ou mais campos são inválidos',
        errors: { departmentId: ['Departamento não encontrado.'] },
      },
      headers: {},
      config: { headers: new AxiosHeaders() },
    };
    const onSubmit = vi
      .fn<(employee: SaveEmployee) => Promise<void>>()
      .mockRejectedValue(
        new AxiosError('Bad Request', '400', undefined, undefined, response as AxiosResponse),
      );
    const { user } = renderForm(onSubmit);
    await fillValidForm(user);

    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByText('Departamento não encontrado.')).toBeInTheDocument();
    expect(screen.getByLabelText('Departamento')).toHaveAttribute('aria-invalid', 'true');
  });
});
