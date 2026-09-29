import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';

function renderDialog(open: boolean) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmDialog
      open={open}
      title="Excluir Marketing?"
      description="Essa ação não pode ser desfeita."
      confirmLabel="Excluir departamento"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  );
  return { onConfirm, onCancel };
}

describe('ConfirmDialog', () => {
  it('stays hidden while closed', () => {
    renderDialog(false);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens as a labelled modal and focuses the safe action', () => {
    renderDialog(true);

    const dialog = screen.getByRole('dialog', { name: 'Excluir Marketing?' });
    expect(dialog).toHaveAccessibleDescription('Essa ação não pode ser desfeita.');
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
  });

  it('calls onConfirm only from the confirm button', async () => {
    const { onConfirm, onCancel } = renderDialog(true);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Excluir departamento' }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('cancels when Escape is pressed', async () => {
    const { onConfirm, onCancel } = renderDialog(true);

    await userEvent.setup().keyboard('{Escape}');

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
