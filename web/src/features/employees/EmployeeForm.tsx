import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { useForm, type Path } from 'react-hook-form';
import { toast } from 'sonner';
import { getErrorMessage } from '../../api/errors';
import type { Department, ProblemDetails, SaveEmployee } from '../../api/types';
import { FormField } from '../../components/FormField';
import { employeeSchema, type EmployeeFormInput, type EmployeeFormOutput } from './employeeSchema';

interface EmployeeFormProps {
  departments: Department[];
  defaultValues?: EmployeeFormInput;
  showStatus?: boolean;
  submitLabel: string;
  onSubmit: (employee: SaveEmployee) => Promise<void>;
}

const EMPTY_FORM: EmployeeFormInput = {
  name: '',
  email: '',
  cpf: '',
  position: '',
  salary: Number.NaN,
  hireDate: '',
  departmentId: 0,
  status: 'Active',
};

export function EmployeeForm({
  departments,
  defaultValues = EMPTY_FORM,
  showStatus = false,
  submitLabel,
  onSubmit,
}: EmployeeFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormInput, unknown, EmployeeFormOutput>({
    resolver: zodResolver(employeeSchema),
    defaultValues,
  });

  const submit = async (values: EmployeeFormOutput) => {
    try {
      await onSubmit(values);
    } catch (error) {
      const fieldErrors = axios.isAxiosError<ProblemDetails>(error)
        ? error.response?.data?.errors
        : undefined;
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, messages]) =>
          setError(field as Path<EmployeeFormInput>, { message: messages[0] }),
        );
      }
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="space-y-4 panel p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nome" error={errors.name?.message}>
          <input type="text" {...register('name')} />
        </FormField>
        <FormField label="E-mail" error={errors.email?.message}>
          <input type="email" {...register('email')} />
        </FormField>
        <FormField label="CPF" error={errors.cpf?.message}>
          <input
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            {...register('cpf')}
          />
        </FormField>
        <FormField label="Cargo" error={errors.position?.message}>
          <input type="text" {...register('position')} />
        </FormField>
        <FormField label="Salário (R$)" error={errors.salary?.message}>
          <input
            type="number"
            step="0.01"
            min="0"
            {...register('salary', { valueAsNumber: true })}
          />
        </FormField>
        <FormField label="Data de admissão" error={errors.hireDate?.message}>
          <input type="date" {...register('hireDate')} />
        </FormField>
        <FormField label="Departamento" error={errors.departmentId?.message}>
          <select {...register('departmentId', { valueAsNumber: true })}>
            <option value={0}>Selecione...</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </FormField>
        {showStatus && (
          <FormField label="Status" error={errors.status?.message}>
            <select {...register('status')}>
              <option value="Active">Ativo</option>
              <option value="Inactive">Inativo</option>
            </select>
          </FormField>
        )}
      </div>
      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
