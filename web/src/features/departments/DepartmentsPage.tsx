import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { getErrorMessage } from '../../api/errors';
import type { Department } from '../../api/types';
import { FormField } from '../../components/FormField';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/QueryStates';
import {
  createDepartment,
  deleteDepartment,
  departmentsKey,
  listDepartments,
  updateDepartment,
} from './departmentsApi';

const departmentSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.').max(100, 'Máximo de 100 caracteres.'),
});

type DepartmentForm = z.infer<typeof departmentSchema>;

export function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Department | null>(null);
  const [toDelete, setToDelete] = useState<Department | null>(null);
  const departments = useQuery({ queryKey: departmentsKey, queryFn: listDepartments });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartmentForm>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: '' },
  });

  const onSaved = (message: string) => {
    toast.success(message);
    setEditing(null);
    reset({ name: '' });
    queryClient.invalidateQueries({ queryKey: departmentsKey });
  };

  const save = useMutation({
    mutationFn: async ({ name }: DepartmentForm) => {
      if (editing) {
        await updateDepartment(editing.id, name);
      } else {
        await createDepartment(name);
      }
    },
    onSuccess: () => onSaved(editing ? 'Departamento atualizado.' : 'Departamento criado.'),
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      setToDelete(null);
      onSaved('Departamento excluído.');
    },
    onError: (error) => {
      setToDelete(null);
      toast.error(getErrorMessage(error));
    },
  });

  const startEditing = (department: Department) => {
    setEditing(department);
    reset({ name: department.name });
  };

  return (
    <>
      <PageHeader title="Departamentos" description="Organize os funcionários por área." />

      <form
        noValidate
        onSubmit={handleSubmit((values) => save.mutate(values))}
        className="mb-6 flex flex-wrap items-start gap-3 panel p-4"
      >
        <div className="min-w-60 flex-1">
          <FormField
            label={editing ? `Editar "${editing.name}"` : 'Novo departamento'}
            error={errors.name?.message}
          >
            <input type="text" placeholder="Ex.: Marketing" {...register('name')} />
          </FormField>
        </div>
        <div className="flex gap-2 pt-6">
          <button type="submit" className="btn-primary" disabled={save.isPending}>
            {save.isPending ? 'Salvando...' : editing ? 'Salvar' : 'Adicionar'}
          </button>
          {editing && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setEditing(null);
                reset({ name: '' });
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {departments.isPending && <LoadingState />}
      {departments.isError && (
        <ErrorState error={departments.error} onRetry={() => departments.refetch()} />
      )}
      {departments.isSuccess && departments.data.length === 0 && (
        <EmptyState message="Nenhum departamento cadastrado." />
      )}
      {departments.isSuccess && departments.data.length > 0 && (
        <ul className="divide-y divide-linha panel">
          {departments.data.map((department) => (
            <li
              key={department.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p className="font-medium text-tinta">{department.name}</p>
                <p className="text-sm text-tinta-suave">
                  {department.employeeCount} funcionário(s)
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => startEditing(department)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setToDelete(department)}
                  disabled={remove.isPending}
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={toDelete !== null}
        title={`Excluir ${toDelete?.name ?? ''}?`}
        description="Só é possível excluir um departamento sem funcionários. Essa ação não pode ser desfeita."
        confirmLabel="Excluir departamento"
        isPending={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
