import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AbsenceTimeline } from './AbsenceTimeline';
import type { Absence } from './dashboardApi';

const absences: Absence[] = [
  {
    id: 1,
    employeeName: 'Ana Souza',
    departmentName: 'Tecnologia',
    startDate: '2026-10-03',
    endDate: '2026-10-07',
    status: 'Approved',
  },
  {
    id: 2,
    employeeName: 'Bruno Lima',
    departmentName: 'Tecnologia',
    startDate: '2026-09-25',
    endDate: '2026-10-02',
    status: 'Pending',
  },
];

describe('AbsenceTimeline', () => {
  it('describes each absence in text for screen readers and small screens', () => {
    render(<AbsenceTimeline windowStart="2026-10-01" windowDays={28} absences={absences} />);

    const list = screen.getByRole('list', { name: 'Ausências nas próximas 4 semanas' });
    const items = within(list).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent(
      'Ana Souza (Tecnologia), férias aprovadas de 03/10/2026 a 07/10/2026',
    );
    expect(items[1]).toHaveTextContent('Bruno Lima (Tecnologia), férias aguardando RH');
  });

  it('places each bar on the days it covers, clipping at the window start', () => {
    const { container } = render(
      <AbsenceTimeline windowStart="2026-10-01" windowDays={28} absences={absences} />,
    );

    const bars = container.querySelectorAll<HTMLElement>('[title]');
    expect(bars[0].style.gridColumn).toBe('4 / 9');
    expect(bars[1].style.gridColumn).toBe('2 / 4');
  });

  it('says nobody is away when there are no absences', () => {
    render(<AbsenceTimeline windowStart="2026-10-01" windowDays={28} absences={[]} />);

    expect(screen.getByText('Ninguém sai de férias nas próximas 4 semanas.')).toBeInTheDocument();
  });
});
