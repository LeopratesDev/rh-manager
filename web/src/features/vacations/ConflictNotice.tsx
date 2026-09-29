import { useQuery } from '@tanstack/react-query';
import { formatDate } from '../../lib/format';
import { listDepartmentConflicts, vacationsKey } from './vacationsApi';

const STATUS_TEXT = {
  Approved: 'aprovada',
  Pending: 'aguardando RH',
  Rejected: 'rejeitada',
} as const;

export function ConflictNotice({ vacationId }: { vacationId: number }) {
  const conflicts = useQuery({
    queryKey: [...vacationsKey, vacationId, 'conflicts'],
    queryFn: () => listDepartmentConflicts(vacationId),
  });

  if (!conflicts.data || conflicts.data.length === 0) {
    return null;
  }

  const count = conflicts.data.length;

  return (
    <div
      role="note"
      className="rounded-md border-l-4 border-carimbo-ocre bg-carimbo-ocre/10 px-3 py-2 text-sm"
    >
      <p className="font-semibold text-carimbo-ocre">
        {count === 1
          ? '1 pessoa do mesmo setor estará ausente no período'
          : `${count} pessoas do mesmo setor estarão ausentes no período`}
      </p>
      <ul className="mt-1 text-tinta">
        {conflicts.data.map((conflict) => (
          <li key={conflict.id}>
            {conflict.employeeName}: {formatDate(conflict.startDate)} a{' '}
            {formatDate(conflict.endDate)} ({STATUS_TEXT[conflict.status]})
          </li>
        ))}
      </ul>
    </div>
  );
}
