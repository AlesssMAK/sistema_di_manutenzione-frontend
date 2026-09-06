export type Period = '7d' | '30d' | '3m' | 'all';

// Lower bound ('created since') for a period, as YYYY-MM-DD, or null for
// "all" (no bound). Shared by the list and the tab-badge count so both hit
// the same server-side `dataCreatedFrom` filter and never disagree.
export const cutoffFor = (period: Period): string | null => {
  if (period === 'all') return null;
  const d = new Date();
  if (period === '7d') d.setDate(d.getDate() - 7);
  else if (period === '30d') d.setDate(d.getDate() - 30);
  else if (period === '3m') d.setMonth(d.getMonth() - 3);
  return d.toISOString().slice(0, 10);
};
