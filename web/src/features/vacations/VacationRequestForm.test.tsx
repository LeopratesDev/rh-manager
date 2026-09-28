import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VacationRequestForm } from './VacationRequestForm';
import type { VacationRequest } from './vacationsApi';

function renderForm() {
  const onSubmit = vi
    .fn<(request: VacationRequest) => Promise<unknown>>()
    .mockResolvedValue(undefined);
  render(<VacationRequestForm isSubmitting={false} onSubmit={onSubmit} />);
  return onSubmit;
}

async function submitPeriod(start: string, end: string) {
  fireEvent.change(screen.getByLabelText('Início'), { target: { value: start } });
  fireEvent.change(screen.getByLabelText('Término'), { target: { value: end } });
  await userEvent.setup().click(screen.getByRole('button', { name: 'Solicitar férias' }));
}

describe('VacationRequestForm', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 28, 10, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('requires both dates', async () => {
    const onSubmit = renderForm();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Solicitar férias' }));

    expect(await screen.findByText('Informe a data de início.')).toBeInTheDocument();
    expect(screen.getByText('Informe a data de término.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects a period shorter than 5 days', async () => {
    const onSubmit = renderForm();

    await submitPeriod('2026-10-10', '2026-10-13');

    expect(
      await screen.findByText('O período deve ter entre 5 e 30 dias (selecionado: 4).'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects a period longer than 30 days', async () => {
    const onSubmit = renderForm();

    await submitPeriod('2026-10-01', '2026-10-31');

    expect(
      await screen.findByText('O período deve ter entre 5 e 30 dias (selecionado: 31).'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects an end date before the start date', async () => {
    const onSubmit = renderForm();

    await submitPeriod('2026-10-10', '2026-10-01');

    expect(
      await screen.findByText('O término deve ser igual ou posterior ao início.'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects a start date in the past', async () => {
    const onSubmit = renderForm();

    await submitPeriod('2026-09-27', '2026-10-06');

    expect(await screen.findByText('As férias não podem começar no passado.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a valid period starting today with exactly 30 days', async () => {
    const onSubmit = renderForm();

    await submitPeriod('2026-09-28', '2026-10-27');

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0][0]).toEqual({ startDate: '2026-09-28', endDate: '2026-10-27' });
  });
});
