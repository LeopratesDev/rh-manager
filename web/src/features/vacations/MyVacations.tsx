import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '../../api/errors';
import { EmptyState, ErrorState, LoadingState } from '../../components/QueryStates';
import { formatDate } from '../../lib/format';
import { VacationRequestForm } from './VacationRequestForm';
import { VacationStatusBadge } from './VacationStatusBadge';
import { listMyVacations, requestVacation, vacationsKey } from './vacationsApi';

const myVacationsKey = [...vacationsKey, 'mine'];

export function MyVacations() {
  const queryClient = useQueryClient();
  const vacations = useQuery({ queryKey: myVacationsKey, queryFn: listMyVacations });

  const request = useMutation({
    mutationFn: requestVacation,
    onSuccess: () => {
      toast.success('Solicitação enviada para aprovação.');
      queryClient.invalidateQueries({ queryKey: vacationsKey });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-tinta">Minhas solicitações</h2>
      <VacationRequestForm isSubmitting={request.isPending} onSubmit={request.mutateAsync} />

      {vacations.isPending && <LoadingState />}
      {vacations.isError && (
        <ErrorState error={vacations.error} onRetry={() => vacations.refetch()} />
      )}
      {vacations.isSuccess && vacations.data.length === 0 && (
        <EmptyState message="Você ainda não fez nenhuma solicitação de férias." />
      )}
      {vacations.isSuccess && vacations.data.length > 0 && (
        <ul className="divide-y divide-linha panel">
          {vacations.data.map((vacation) => (
            <li
              key={vacation.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p className="font-medium text-tinta">
                  {formatDate(vacation.startDate)} a {formatDate(vacation.endDate)}
                  <span className="ml-2 text-sm font-normal text-tinta-suave">
                    ({vacation.days} dias)
                  </span>
                </p>
                {vacation.rejectionReason && (
                  <p className="text-sm text-carimbo-vermelho">
                    Motivo: {vacation.rejectionReason}
                  </p>
                )}
              </div>
              <VacationStatusBadge status={vacation.status} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
