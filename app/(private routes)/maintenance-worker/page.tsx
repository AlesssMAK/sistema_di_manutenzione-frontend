import FaultCardsList from '@/components/FaultCardsList/FaultCardsList';
import MaintenanceWorkerClient from './MaintenanceWorker.client';

const maintenanceWorkerPage = () => {
  return (
    <div>
      <MaintenanceWorkerClient />
      <FaultCardsList />
    </div>
  );
};

export default maintenanceWorkerPage;
