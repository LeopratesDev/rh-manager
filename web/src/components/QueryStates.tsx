import { getErrorMessage } from '../api/errors';

export function LoadingState({ label = 'Carregando...' }: { label?: string }) {
  return (
    <p role="status" className="py-10 text-center text-sm text-slate-500">
      {label}
    </p>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">
      {message}
    </p>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      <span>{getErrorMessage(error)}</span>
      <button type="button" className="btn-secondary" onClick={onRetry}>
        Tentar novamente
      </button>
    </div>
  );
}
