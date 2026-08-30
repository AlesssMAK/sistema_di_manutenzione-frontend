import { FaultCard, ReportFormValues } from '@/types/faultType';
import nextServer from './api';

interface FetchParams {
  page?: number;
  perPage?: number;
  search?: string;
  priority?: string;
  deadline?: string;
  dataCreated?: string;
  /** Lower bound 'created since' window (YYYY-MM-DD). */
  dataCreatedFrom?: string;
  plannedDate?: string;
  /** Planned-date range (Filtri panel), 'YYYY-MM-DD'. */
  plannedDateFrom?: string;
  plannedDateTo?: string;
  /** Deadline range — the "In ritardo" tab filters by deadline. */
  deadlineFrom?: string;
  deadlineTo?: string;
  /** Completed-at range — the "Completate" tab filters by the close day. */
  completedFrom?: string;
  completedTo?: string;
  statusFault?: string;
  typeFault?: string;
  assignedTo?: string;
  assignedToEmpty?: boolean;
  /** Only faults that DO have at least one assigned maintainer (manager
   *  "Pianificati" = Created + already planned). */
  assignedToNotEmpty?: boolean;
  createdById?: string;
  /** Direction of the createdAt sort. 'asc' = oldest first. */
  sort?: 'asc' | 'desc';
  /** Sort by a specific field (e.g. 'completedAt' for the closed history). */
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  /** Ask the board endpoint to annotate each card with `unseen` and the
   *  response with `hasUnseen`. */
  withUnseen?: boolean;
  /** The current list's lastSeen timestamp (ISO). Drives model A — faults
   *  assigned to others clear once this passes their updatedAt. */
  seenSince?: string;
}
export interface FetchFaultCardsParams {
  fault: FaultCard[];
  totalFault: number;
  totalPage: number;
  page: number;
  perPage: number;
  /** Present only when withUnseen was requested: does any fault in the
   *  whole (unpaginated) query count as unseen for the viewer? */
  hasUnseen?: boolean;
}

export interface FaultDeadlineBucket {
  date: string;
  count: number;
  byPriority: { Low: number; Medium: number; High: number };
}

export interface FaultDeadlinesResponse {
  field: 'plannedDate' | 'deadline' | 'completedAt';
  dateFrom: string;
  dateTo: string;
  dates: FaultDeadlineBucket[];
}

interface FetchDeadlinesParams {
  dateFrom: string;
  dateTo: string;
  field?: 'plannedDate' | 'deadline' | 'completedAt';
  statusFault?: string;
  priority?: string;
  assignedTo?: string;
  assignedToEmpty?: boolean;
}

export const fetchFaultDeadlines = async ({
  dateFrom,
  dateTo,
  field = 'plannedDate',
  statusFault,
  priority,
  assignedTo,
  assignedToEmpty,
}: FetchDeadlinesParams): Promise<FaultDeadlinesResponse> => {
  const res = await nextServer.get<FaultDeadlinesResponse>(
    '/faults/deadlines',
    {
      params: {
        dateFrom,
        dateTo,
        field,
        ...(statusFault ? { statusFault } : {}),
        ...(priority ? { priority } : {}),
        ...(assignedTo ? { assignedTo } : {}),
        ...(assignedToEmpty ? { assignedToEmpty: 'true' } : {}),
      },
    }
  );
  return res.data;
};

export const fetchFaultCards = async ({
  page,
  perPage,
  search,
  priority = '',
  deadline,
  dataCreated,
  dataCreatedFrom,
  plannedDate,
  plannedDateFrom,
  plannedDateTo,
  deadlineFrom,
  deadlineTo,
  completedFrom,
  completedTo,
  statusFault,
  typeFault,
  assignedTo,
  assignedToEmpty,
  assignedToNotEmpty,
  createdById,
  sort,
  sortBy,
  sortOrder,
  withUnseen,
  seenSince,
}: FetchParams): Promise<FetchFaultCardsParams> => {
  const res = await nextServer.get('/faults', {
    params: {
      page,
      perPage,
      ...(search ? { search } : {}),
      ...(priority ? { priority } : {}),
      deadline,
      ...(dataCreated ? { dataCreated } : {}),
      ...(dataCreatedFrom ? { dataCreatedFrom } : {}),
      ...(plannedDate ? { plannedDate } : {}),
      ...(plannedDateFrom ? { plannedDateFrom } : {}),
      ...(plannedDateTo ? { plannedDateTo } : {}),
      ...(deadlineFrom ? { deadlineFrom } : {}),
      ...(deadlineTo ? { deadlineTo } : {}),
      ...(completedFrom ? { completedFrom } : {}),
      ...(completedTo ? { completedTo } : {}),
      ...(statusFault ? { statusFault } : {}),
      ...(typeFault ? { typeFault } : {}),
      ...(assignedTo ? { assignedTo } : {}),
      ...(assignedToEmpty ? { assignedToEmpty: 'true' } : {}),
      ...(assignedToNotEmpty ? { assignedToNotEmpty: 'true' } : {}),
      ...(createdById ? { createdById } : {}),
      ...(sort ? { sort } : {}),
      ...(sortBy ? { sortBy } : {}),
      ...(sortOrder ? { sortOrder } : {}),
      ...(withUnseen ? { withUnseen: 'true' } : {}),
      ...(seenSince ? { seenSince } : {}),
    },
  });

  return res.data;
};

export const createFault = async (data: ReportFormValues) => {
  const formData = new FormData();

  formData.append('faultId', data.faultId);
  formData.append('dataCreated', data.dataCreated);
  formData.append('timeCreated', data.timeCreated);
  formData.append('plantId', data.plantId);
  formData.append('partId', data.partId);
  formData.append('typeFault', data.typeFault);
  formData.append('comment', data.comment);

  if (data.img && data.img.length > 0) {
    data.img.forEach(file => {
      formData.append('img', file);
    });
  }

  const res = await nextServer.post('/faults', formData);

  return res.data;
};

export const fetchFaultById = async (id: string): Promise<FaultCard> => {
  if (!id) {
    throw new Error('Fault ID is required');
  }

  const res = await nextServer.get<FaultCard>(`/faults/${id}`);

  return res.data;
};

export interface UpdateFaultPayload {
  faultId: string;
  statusFault: string;
  commentMaintenanceWorker?: string;
  actualDuration?: number;
  suspensionReason?: string;
  materialRequest?: string;
}

export const updateFaultByWorker = async (
  payload: UpdateFaultPayload
): Promise<FaultCard> => {
  if (!payload.faultId) {
    throw new Error('Fault ID is required');
  }

  const res = await nextServer.patch<FaultCard>(
    `/faults/${payload.faultId}`,
    payload
  );

  return res.data;
};

// The fault a technician is already actively working on, returned by the
// backend's 409 ALREADY_WORKING guard (claim / resume). Enough to render
// the "già al lavoro" modal and navigate to it.
export interface ActiveWorkFault {
  _id: string;
  faultId: string;
  statusFault: string;
  plannedDate?: string;
  plannedTime?: string;
  plantId?: { namePlant?: string; code?: string } | null;
  partId?: { namePlantPart?: string; codePlantPart?: string } | null;
  /** Work-time accounting, used to prefill the finalize duration when the
   *  fault is finalized straight from the "already working" modal. */
  workedMs?: number;
  workStartedAt?: string | null;
}

// Pull the active fault out of an ALREADY_WORKING 409 (null for any other
// error), so the caller can show the finalize / suspend / continue modal
// instead of a generic toast.
export const getAlreadyWorkingFault = (
  err: unknown
): ActiveWorkFault | null => {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (
      err as {
        response?: {
          data?: { code?: string; activeFault?: ActiveWorkFault };
        };
      }
    ).response?.data;
    if (data?.code === 'ALREADY_WORKING' && data.activeFault) {
      return data.activeFault;
    }
  }
  return null;
};

export const claimFault = async (faultId: string): Promise<FaultCard> => {
  if (!faultId) {
    throw new Error('Fault ID is required');
  }

  const res = await nextServer.patch<FaultCard>(
    `/maintenance-worker/fault/${faultId}/claim`
  );

  return res.data;
};

// Dot-free `<role>_<tab>` keys for per-list lastSeen (model A). Kept in
// sync with the backend LIST_SEEN_KEYS + patchListSeen validation.
export type ListSeenKey =
  | 'worker_active'
  | 'worker_inProgress'
  | 'worker_suspended'
  | 'worker_overdue'
  | 'worker_completed'
  | 'worker_pool'
  | 'manager_received'
  | 'manager_planned'
  | 'manager_suspended'
  | 'manager_inprogress'
  | 'manager_archive'
  | 'safety_all';

// The viewer's per-list lastSeen map ({ key: ISO }). Fed back as
// `seenSince` when loading each board.
export const fetchListSeen = async (): Promise<
  Partial<Record<ListSeenKey, string>>
> => {
  const res = await nextServer.get('/faults/list-seen');
  return res.data ?? {};
};

// Advance one list's lastSeen to now — clears others-assigned (model A)
// cards on that list.
export const markListSeen = async (key: ListSeenKey): Promise<void> => {
  await nextServer.patch('/faults/list-seen', { key });
};

// Mark a single fault individually seen (detail-open) — clears its dot.
export const markFaultSeen = async (id: string): Promise<void> => {
  if (!id) return;
  await nextServer.post(`/faults/${id}/seen`);
};