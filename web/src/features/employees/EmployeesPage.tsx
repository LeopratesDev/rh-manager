import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { getErrorMessage } from '../../api/errors';
import type { Employee, EmployeeStatus } from '../../api/types';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/QueryStates';
import { formatCpf, formatCurrency, formatDate } from '../../lib/format';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import { departmentsKey, listDepartments } from '../departments/departmentsApi';
import { deactivateEmployee, employeesKey, listEmployees } from './employeesApi';

const PAGE_SIZE = 10;

function countLabel(total: number): string {
  return total === 1 ? '1 funcionário' : `${total} funcionários`;
}

export function EmployeesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [status, setStatus] = useState<EmployeeStatus | null>(null);
  const [toDeactivate, setToDeactivate] = useState<Employee | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  const filters = { page, pageSize: PAGE_SIZE, search: debouncedSearch, departmentId, status };
  const employees = useQuery({
    queryKey: [...employeesKey, filters],
    queryFn: () => listEmployees(filters),
    placeholderData: keepPreviousData,
  });
  const departments = useQuery({ queryKey: departmentsKey, queryFn: listDepartments });

  const deactivate = useMutation({
    mutationFn: deactivateEmployee,
    onSuccess: () => {
      toast.success('Funcionário desativado.');
      setToDeactivate(null);
      queryClient.invalidateQueries({ queryKey: employeesKey });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const changeFilter = (apply: () => void) => {
    apply();
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Funcionários"
        description={employees.data ? countLabel(employees.data.totalItems) : undefined}
        actions={
          <Link to="/employees/new" className="btn-primary">
            Novo funcionário
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_240px_170px]">
        <input
          type="search"
          aria-label="Buscar por nome"
          placeholder="Buscar por nome..."
          className="input"
          value={search}
          onChange={(event) => changeFilter(() => setSearch(event.target.value))}
        />
        <select
          aria-label="Filtrar por departamento"
          className="input"
          value={departmentId ?? ''}
          onChange={(event) =>
            changeFilter(() =>
              setDepartmentId(event.target.value ? Number(event.target.value) : null),
            )
          }
        >
          <option value="">Todos os departamentos</option>
          {departments.data?.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por status"
          className="input"
          value={status ?? ''}
          onChange={(event) =>
            changeFilter(() => setStatus((event.target.value || null) as EmployeeStatus | null))
          }
        >
          <option value="">Todos os status</option>
          <option value="Active">Ativos</option>
          <option value="Inactive">Inativos</option>
        </select>
      </div>

      {employees.isPending && <LoadingState />}
      {employees.isError && (
        <ErrorState error={employees.error} onRetry={() => employees.refetch()} />
      )}
      {employees.isSuccess && employees.data.items.length === 0 && (
        <EmptyState message="Nenhum funcionário encontrado com esses filtros." />
      )}
      {employees.isSuccess && employees.data.items.length > 0 && (
        <>
          <div className="overflow-x-auto panel">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-linha text-tinta-suave">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">CPF</th>
                  <th className="px-4 py-3 font-medium">Cargo</th>
                  <th className="px-4 py-3 font-medium">Departamento</th>
                  <th className="px-4 py-3 font-medium">Salário</th>
                  <th className="px-4 py-3 font-medium">Admissão</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-linha">
                {employees.data.items.map((employee) => (
                  <tr
                    key={employee.id}
                    className={employee.status === 'Inactive' ? 'text-tinta-suave' : undefined}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-tinta">{employee.name}</p>
                      <p className="text-tinta-suave">{employee.email}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatCpf(employee.cpf)}</td>
                    <td className="px-4 py-3">{employee.position}</td>
                    <td className="px-4 py-3">{employee.departmentName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatCurrency(employee.salary)}
                    </td>
                    <td className="px-4 py-3">{formatDate(employee.hireDate)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold ${employee.status === 'Active' ? 'text-carimbo-verde' : 'text-tinta-suave'}`}
                      >
                        {employee.status === 'Active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link to={`/employees/${employee.id}/edit`} className="btn-secondary">
                          Editar
                        </Link>
                        {employee.status === 'Active' && (
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setToDeactivate(employee)}
                            disabled={deactivate.isPending}
                          >
                            Desativar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav
            aria-label="Paginação"
            className="mt-4 flex items-center justify-between text-sm text-tinta-suave"
          >
            <span>
              Página {employees.data.page} de {Math.max(employees.data.totalPages, 1)}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPage((current) => current - 1)}
                disabled={page <= 1}
              >
                Anterior
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPage((current) => current + 1)}
                disabled={page >= employees.data.totalPages}
              >
                Próxima
              </button>
            </div>
          </nav>
        </>
      )}
      <ConfirmDialog
        open={toDeactivate !== null}
        title={`Desativar ${toDeactivate?.name ?? ''}?`}
        description="A pessoa sai da lista de ativos e não consegue mais pedir férias. O histórico é mantido e você pode reativar editando o cadastro."
        confirmLabel="Desativar funcionário"
        isPending={deactivate.isPending}
        onConfirm={() => toDeactivate && deactivate.mutate(toDeactivate.id)}
        onCancel={() => setToDeactivate(null)}
      />
    </>
  );
}
