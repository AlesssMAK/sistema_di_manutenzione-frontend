export const roleRoutes: Record<string, string[]> = {
  admin: ['/admin', '/messages', '/reports-and-communications'],
  manager: [
    '/manager',
    '/report-fault',
    '/messages',
    '/reports-and-communications',
  ],
  maintenanceWorker: [
    '/maintenance-worker',
    '/report-fault',
    '/messages',
    '/reports-and-communications',
  ],
  operator: [
    '/operator',
    '/report-fault',
    '/messages',
    '/reports-and-communications',
  ],
  safety: [
    '/safety',
    '/report-fault',
    '/messages',
    '/reports-and-communications',
  ],
};
