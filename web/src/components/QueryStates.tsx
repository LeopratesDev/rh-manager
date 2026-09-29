import { getErrorMessage } from '../api/errors';

export function LoadingState({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-3">
      {[0, 1, 2].map((row) => (
        <div
          key={row}
          className="h-12 animate-pulse rounded-md bg-linha/60 motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-dashed border-linha py-10 text-center text-sm text-tinta-suave">
      {message}
    </p>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-carimbo-vermelho/30 bg-carimbo-vermelho/5 px-4 py-3 text-sm text-carimbo-vermelho"
    >
      <span>{getErrorMessage(error)}</span>
      <button type="button" className="btn-secondary" onClick={onRetry}>
        Tentar novamente
      </button>
    </div>
  );
}
