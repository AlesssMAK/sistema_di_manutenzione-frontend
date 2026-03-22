import FaultCardsList from '@/components/FaultCardsList/FaultCardsList';
import MaintenanceWorkerClient from './MaintenanceWorker.client';
import { fetchFaultCards } from '@/lib/api/serverApi';

const maintenanceWorkerPage = async () => {
  const { items } = await fetchFaultCards({ page: 1, limit: 2 });
  return (
    <div>
      <MaintenanceWorkerClient />
      <FaultCardsList faults={items} />
    </div>
  );
};

export default maintenanceWorkerPage;
