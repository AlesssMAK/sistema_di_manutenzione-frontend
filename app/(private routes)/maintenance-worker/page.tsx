import MaintenanceWorkerClient from './MaintenanceWorker.client';

const maintenanceWorkerPage = () => {
  throw new Error('Test error');
  return (
    <div>
      <MaintenanceWorkerClient />
    </div>
  );
};

export default maintenanceWorkerPage;
