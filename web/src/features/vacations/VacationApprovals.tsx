import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '../../api/errors';
import { EmptyState, ErrorState, LoadingState } from '../../components/QueryStates';
import { formatDate } from '../../lib/format';
import { dashboardKey } from '../dashboard/dashboardApi';
import { VacationStatusBadge } from './VacationStatusBadge';
import {
  approveVacation,
  listVacations,
  rejectVacation,
  vacationsKey,
  type Vacation,
  type VacationStatus,
} from './vacationsApi';

export function VacationApprovals() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<VacationStatus | null>('Pending');
  const [rejecting, setRejecting] = useState<Vacation | null>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  const vacations = useQuery({
    queryKey: [...vacationsKey, 'all', status],
    queryFn: () => listVacations(status),
  });

  const onReviewed = (message: string) => {
    toast.success(message);
    setRejecting(null);
    setReason('');
    queryClient.invalidateQueries({ queryKey: vacationsKey });
    queryClient.invalidateQueries({ queryKey: dashboardKey });
  };

  const approve = useMutation({
    mutationFn: approveVacation,
    onSuccess: () => onReviewed('Férias aprovadas.'),
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const reject = useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) => rejectVacation(id, text),
    onSuccess: () => onReviewed('Férias rejeitadas.'),
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const submitRejection = (vacation: Vacation) => {
    const text = reason.trim();
    if (!text) {
      setReasonError('Informe o motivo da rejeição.');
      return;
    }
    setReasonError(null);
    reject.mutate({ id: vacation.id, text });
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Aprovações</h2>
        <select
          aria-label="Filtrar solicitações por status"
          className="input max-w-48"
          value={status ?? ''}
          onChange={(event) => setStatus((event.target.value || null) as VacationStatus | null)}
        >
          <option value="Pending">Pendentes</option>
          <option value="Approved">Aprovadas</option>
          <option value="Rejected">Rejeitadas</option>
          <option value="">Todas</option>
        </select>
      </div>

      {vacations.isPending && <LoadingState />}
      {vacations.isError && (
        <ErrorState error={vacations.error} onRetry={() => vacations.refetch()} />
      )}
      {vacations.isSuccess && vacations.data.length === 0 && (
        <EmptyState message="Nenhuma solicitação com esse status." />
      )}
      {vacations.isSuccess && vacations.data.length > 0 && (
        <ul className="divide-y divide-slate-200 rounded-lg bg-white shadow-sm">
          {vacations.data.map((vacation) => (
            <li key={vacation.id} className="space-y-3 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{vacation.employeeName}</p>
                  <p className="text-sm text-slate-500">
                    {formatDate(vacation.startDate)} a {formatDate(vacation.endDate)} (
                    {vacation.days} dias)
                  </p>
                  {vacation.rejectionReason && (
                    <p className="text-sm text-red-700">Motivo: {vacation.rejectionReason}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <VacationStatusBadge status={vacation.status} />
                  {vacation.status === 'Pending' && rejecting?.id !== vacation.id && (
                    <>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => approve.mutate(vacation.id)}
                        disabled={approve.isPending}
                      >
                        Aprovar
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setRejecting(vacation)}
                      >
                        Rejeitar
                      </button>
                    </>
                  )}
                </div>
              </div>

              {rejecting?.id === vacation.id && (
                <div className="space-y-2 rounded-md bg-slate-50 p-3">
                  <label
                    htmlFor={`reason-${vacation.id}`}
                    className="block text-sm font-medium text-slate-700"
                  >
                    Motivo da rejeição
                  </label>
                  <textarea
                    id={`reason-${vacation.id}`}
                    className="input"
                    rows={2}
                    maxLength={500}
                    value={reason}
                    aria-invalid={reasonError ? true : undefined}
                    onChange={(event) => setReason(event.target.value)}
                  />
                  {reasonError && <p className="text-sm text-red-600">{reasonError}</p>}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => submitRejection(vacation)}
                      disabled={reject.isPending}
                    >
                      Confirmar rejeição
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setRejecting(null);
                        setReason('');
                        setReasonError(null);
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
