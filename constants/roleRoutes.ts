export const roleRoutes: Record<string, string[]> = {
  admin: ['/admin', '/messages'],
  manager: ['/manager', '/report-fault', '/messages'],
  maintenanceWorker: ['/maintenance-worker', '/report-fault', '/messages'],
  operator: ['/operator', '/report-fault', '/messages'],
  safety: ['/safety', '/report-fault', '/messages'],
};
