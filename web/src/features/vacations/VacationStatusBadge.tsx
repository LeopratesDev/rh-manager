import type { VacationStatus } from './vacationsApi';

const STYLES: Record<VacationStatus, { label: string; className: string }> = {
  Pending: { label: 'Pendente', className: 'bg-amber-50 text-amber-700' },
  Approved: { label: 'Aprovada', className: 'bg-emerald-50 text-emerald-700' },
  Rejected: { label: 'Rejeitada', className: 'bg-red-50 text-red-700' },
};

export function VacationStatusBadge({ status }: { status: VacationStatus }) {
  const { label, className } = STYLES[status];
  return <span className={`rounded-full px-2 py-0.5 text-xs ${className}`}>{label}</span>;
}
