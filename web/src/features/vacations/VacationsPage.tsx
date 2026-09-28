import { PageHeader } from '../../components/PageHeader';
import { useAuth } from '../auth/authContext';
import { MyVacations } from './MyVacations';
import { VacationApprovals } from './VacationApprovals';

export function VacationsPage() {
  const { user } = useAuth();

  return (
    <>
      <PageHeader title="Férias" description="Solicitações de 5 a 30 dias, aprovadas pelo RH." />
      <div className="space-y-10">
        {user?.employeeId && <MyVacations />}
        {user?.role === 'Admin' && <VacationApprovals />}
      </div>
    </>
  );
}
