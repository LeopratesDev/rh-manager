import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/QueryStates';
import { formatDate } from '../../lib/format';
import { AbsenceTimeline } from './AbsenceTimeline';
import { dashboardKey, getDashboard } from './dashboardApi';

const ABSENCE_WINDOW_DAYS = 28;

interface StatCardProps {
  label: string;
  value: number;
  to: string;
  hint: string;
  highlight?: boolean;
}

function StatCard({ label, value, to, hint, highlight = false }: StatCardProps) {
  return (
    <Link
      to={to}
      className={`panel block border-l-4 p-5 hover:border-ctps-claro ${highlight ? 'border-l-carimbo-ocre' : 'border-l-ctps'}`}
    >
      <p className="text-sm text-tinta-suave">{label}</p>
      <p className="mt-1 text-4xl font-extrabold text-ctps tabular-nums">{value}</p>
      <p className="mt-2 text-xs font-semibold text-ctps-claro">{hint}</p>
    </Link>
  );
}

export function DashboardPage() {
  const dashboard = useQuery({ queryKey: dashboardKey, queryFn: getDashboard });

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Visão geral do quadro de funcionários e das férias."
      />
      {dashboard.isPending && <LoadingState />}
      {dashboard.isError && (
        <ErrorState error={dashboard.error} onRetry={() => dashboard.refetch()} />
      )}
      {dashboard.isSuccess && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              label="Funcionários ativos"
              value={dashboard.data.totalActiveEmployees}
              to="/employees"
              hint="Ver funcionários"
            />
            <StatCard
              label="Férias pendentes"
              value={dashboard.data.pendingVacations}
              to="/vacations"
              hint={
                dashboard.data.pendingVacations > 0 ? 'Revisar pedidos' : 'Nenhum pedido esperando'
              }
              highlight={dashboard.data.pendingVacations > 0}
            />
          </div>

          <section className="panel p-5">
            <h2 className="font-semibold text-tinta">Quem estará ausente</h2>
            <p className="mb-4 text-sm text-tinta-suave">
              De {formatDate(dashboard.data.windowStart)} a {formatDate(dashboard.data.windowEnd)}
            </p>
            <AbsenceTimeline
              windowStart={dashboard.data.windowStart}
              windowDays={ABSENCE_WINDOW_DAYS}
              absences={dashboard.data.absences}
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="panel p-5">
              <h2 className="mb-4 font-semibold text-tinta">
                Funcionários ativos por departamento
              </h2>
              <ul className="space-y-3">
                {dashboard.data.employeesByDepartment.map((department) => (
                  <li key={department.departmentId}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-tinta">{department.departmentName}</span>
                      <span className="font-medium text-tinta">{department.activeEmployees}</span>
                    </div>
                    <div className="h-2 rounded-full bg-papel">
                      <div
                        className="h-2 rounded-full bg-ctps"
                        style={{
                          width: `${dashboard.data.totalActiveEmployees ? (department.activeEmployees / dashboard.data.totalActiveEmployees) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="panel p-5">
              <h2 className="mb-4 font-semibold text-tinta">Próximas férias aprovadas</h2>
              {dashboard.data.upcomingVacations.length === 0 ? (
                <EmptyState message="Nenhuma férias aprovada nos próximos dias." />
              ) : (
                <ul className="divide-y divide-linha">
                  {dashboard.data.upcomingVacations.map((vacation) => (
                    <li key={vacation.id} className="flex justify-between gap-3 py-2 text-sm">
                      <span className="text-tinta">{vacation.employeeName}</span>
                      <span className="text-tinta-suave">
                        {formatDate(vacation.startDate)} a {formatDate(vacation.endDate)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </>
  );
}
