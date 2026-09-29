import type { VacationStatus } from './vacationsApi';

const STAMPS: Record<VacationStatus, { label: string; className: string }> = {
  Pending: { label: 'Aguardando RH', className: 'stamp-pending' },
  Approved: { label: 'Aprovada', className: 'stamp-approved' },
  Rejected: { label: 'Rejeitada', className: 'stamp-rejected' },
};

export function VacationStatusBadge({ status }: { status: VacationStatus }) {
  const { label, className } = STAMPS[status];
  return <span className={`stamp ${className}`}>{label}</span>;
}
