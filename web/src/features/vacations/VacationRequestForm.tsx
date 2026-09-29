import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormField } from '../../components/FormField';
import { countDaysInclusive, todayIso } from '../../lib/dates';
import type { VacationRequest } from './vacationsApi';

export const MIN_DAYS = 5;
export const MAX_DAYS = 30;

const vacationSchema = z
  .object({
    startDate: z.string().min(1, 'Informe a data de início.'),
    endDate: z.string().min(1, 'Informe a data de término.'),
  })
  .superRefine(({ startDate, endDate }, context) => {
    if (!startDate || !endDate) {
      return;
    }
    if (startDate < todayIso()) {
      context.addIssue({
        code: 'custom',
        path: ['startDate'],
        message: 'As férias não podem começar no passado.',
      });
    }
    if (endDate < startDate) {
      context.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'O término deve ser igual ou posterior ao início.',
      });
      return;
    }
    const days = countDaysInclusive(startDate, endDate);
    if (days < MIN_DAYS || days > MAX_DAYS) {
      context.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: `O período deve ter entre ${MIN_DAYS} e ${MAX_DAYS} dias (selecionado: ${days}).`,
      });
    }
  });

interface VacationRequestFormProps {
  isSubmitting: boolean;
  onSubmit: (request: VacationRequest) => Promise<unknown>;
}

export function VacationRequestForm({ isSubmitting, onSubmit }: VacationRequestFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VacationRequest>({
    resolver: zodResolver(vacationSchema),
    defaultValues: { startDate: '', endDate: '' },
  });

  const submit = async (values: VacationRequest) => {
    await onSubmit(values);
    reset();
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => submit(values).catch(() => undefined))}
      className="grid gap-4 panel p-4 sm:grid-cols-[1fr_1fr_auto]"
    >
      <FormField label="Início" error={errors.startDate?.message}>
        <input type="date" min={todayIso()} {...register('startDate')} />
      </FormField>
      <FormField label="Término" error={errors.endDate?.message}>
        <input type="date" {...register('endDate')} />
      </FormField>
      <div className="sm:pt-6">
        <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Solicitar férias'}
        </button>
      </div>
    </form>
  );
}
