import { addDays, isWeekend, spanInWindow } from '../../lib/dates';
import { formatDate } from '../../lib/format';
import type { Absence } from './dashboardApi';

interface AbsenceTimelineProps {
  windowStart: string;
  windowDays: number;
  absences: Absence[];
}

const STATUS_TEXT: Record<Absence['status'], string> = {
  Approved: 'férias aprovadas',
  Pending: 'férias aguardando RH',
};

export function AbsenceTimeline({ windowStart, windowDays, absences }: AbsenceTimelineProps) {
  const days = Array.from({ length: windowDays }, (_, index) => addDays(windowStart, index));
  const columns = `minmax(9rem, 12rem) repeat(${windowDays}, minmax(0, 1fr))`;

  if (absences.length === 0) {
    return (
      <p className="py-6 text-sm text-tinta-suave">Ninguém sai de férias nas próximas 4 semanas.</p>
    );
  }

  return (
    <>
      <div aria-hidden="true" className="hidden md:block">
        <div className="grid text-[11px] text-tinta-suave" style={{ gridTemplateColumns: columns }}>
          <span />
          {days.map((day) => (
            <span
              key={day}
              className={`py-1 text-center ${isWeekend(day) ? 'bg-papel' : ''} ${day.endsWith('-01') ? 'font-bold text-ctps' : ''}`}
            >
              {day.slice(8)}
            </span>
          ))}
        </div>

        {absences.map((absence) => {
          const span = spanInWindow(windowStart, windowDays, absence.startDate, absence.endDate);
          if (!span) return null;
          const isPending = absence.status === 'Pending';

          return (
            <div
              key={absence.id}
              className="grid items-center border-t border-linha"
              style={{ gridTemplateColumns: columns }}
            >
              <div className="truncate py-2 pr-3 text-sm">
                <span className="font-medium text-tinta">{absence.employeeName}</span>
                <span className="block truncate text-xs text-tinta-suave">
                  {absence.departmentName}
                </span>
              </div>
              <div
                title={`${absence.employeeName}: ${formatDate(absence.startDate)} a ${formatDate(absence.endDate)}`}
                className={`h-5 rounded-sm ${
                  isPending
                    ? 'border border-dashed border-carimbo-ocre bg-[repeating-linear-gradient(135deg,transparent_0_4px,rgb(154_106_18/0.25)_4px_8px)]'
                    : 'bg-carimbo-verde'
                }`}
                style={{ gridColumn: `${span.firstDay + 2} / ${span.lastDay + 3}` }}
              />
            </div>
          );
        })}

        <div className="mt-3 flex gap-5 text-xs text-tinta-suave">
          <span className="flex items-center gap-2">
            <span className="inline-block h-3 w-6 rounded-sm bg-carimbo-verde" /> Aprovadas
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-3 w-6 rounded-sm border border-dashed border-carimbo-ocre" />
            Aguardando RH
          </span>
        </div>
      </div>

      <ul aria-label="Ausências nas próximas 4 semanas" className="space-y-2 md:sr-only">
        {absences.map((absence) => (
          <li key={absence.id} className="text-sm">
            <span className="font-medium">{absence.employeeName}</span> ({absence.departmentName}),{' '}
            {STATUS_TEXT[absence.status]} de {formatDate(absence.startDate)} a{' '}
            {formatDate(absence.endDate)}
          </li>
        ))}
      </ul>
    </>
  );
}
