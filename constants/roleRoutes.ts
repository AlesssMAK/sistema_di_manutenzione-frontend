export const roleRoutes: Record<string, string[]> = {
  admin: ['/admin'],
  manager: ['/manager', '/report-fault'],
  maintenanceWorker: ['/maintenance-worker', '/report-fault'],
  operator: ['/operator', '/report-fault'],
  safety: ['/safety', '/report-fault'],
};
