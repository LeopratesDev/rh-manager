import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-description"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-lg border border-linha p-6 text-tinta backdrop:bg-ctps-escuro/60"
    >
      <h2 id="confirm-title" className="text-lg font-bold text-ctps">
        {title}
      </h2>
      <p id="confirm-description" className="mt-2 text-sm text-tinta-suave">
        {description}
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCancel} autoFocus>
          Cancelar
        </button>
        <button type="button" className="btn-danger" onClick={onConfirm} disabled={isPending}>
          {isPending ? 'Aguarde...' : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
