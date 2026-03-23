import FaultCardsList from '@/components/FaultCardsList/FaultCardsList';
import MaintenanceWorkerClient from './MaintenanceWorker.client';
import { fetchFaultCards } from '@/lib/api/serverApi';
import CalendarBlock from '@/components/CalendarBlock/CalendarBlock';
import css from './page.module.css';

const maintenanceWorkerPage = async () => {
  const { items } = await fetchFaultCards({ page: 1, limit: 2 });
  return (
    <div>
      <MaintenanceWorkerClient />
      <div className={css.pageWorkerContainer}>
        <CalendarBlock />
        <FaultCardsList faults={items} />
      </div>
    </div>
  );
};

export default maintenanceWorkerPage;
