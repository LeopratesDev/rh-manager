import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import type { SaveEmployee } from '../../api/types';
import { PageHeader } from '../../components/PageHeader';
import { ErrorState, LoadingState } from '../../components/QueryStates';
import { departmentsKey, listDepartments } from '../departments/departmentsApi';
import { EmployeeForm } from './EmployeeForm';
import { createEmployee, employeesKey, getEmployee, updateEmployee } from './employeesApi';

export function EmployeeFormPage() {
  const { id } = useParams();
  const employeeId = id ? Number(id) : null;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const departments = useQuery({ queryKey: departmentsKey, queryFn: listDepartments });
  const employee = useQuery({
    queryKey: [...employeesKey, employeeId],
    queryFn: () => getEmployee(employeeId!),
    enabled: employeeId !== null,
  });

  const save = async (values: SaveEmployee) => {
    if (employeeId === null) {
      await createEmployee(values);
    } else {
      await updateEmployee(employeeId, values);
    }
    await queryClient.invalidateQueries({ queryKey: employeesKey });
    toast.success(employeeId === null ? 'Funcionário cadastrado.' : 'Funcionário atualizado.');
    navigate('/employees');
  };

  const isLoading = departments.isPending || (employeeId !== null && employee.isPending);
  const failedQuery = departments.isError ? departments : employee.isError ? employee : null;

  return (
    <>
      <PageHeader
        title={employeeId === null ? 'Novo funcionário' : 'Editar funcionário'}
        actions={
          <Link to="/employees" className="btn-secondary">
            Voltar
          </Link>
        }
      />
      {failedQuery && (
        <ErrorState error={failedQuery.error} onRetry={() => failedQuery.refetch()} />
      )}
      {!failedQuery && isLoading && <LoadingState />}
      {!failedQuery && !isLoading && (
        <EmployeeForm
          departments={departments.data ?? []}
          defaultValues={employee.data}
          showStatus={employeeId !== null}
          submitLabel={employeeId === null ? 'Cadastrar' : 'Salvar alterações'}
          onSubmit={save}
        />
      )}
    </>
  );
}
