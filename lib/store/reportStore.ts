import { NewFaultContent } from '@/types/faultType';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FaultDraftState {
  /** Drafts keyed by user id so each account keeps its own work in
   *  progress — several users sharing one browser no longer overwrite
   *  each other's draft. */
  drafts: Record<string, NewFaultContent>;
  setDraft: (userId: string, draft: NewFaultContent) => void;
  clearDraft: (userId: string) => void;
}

export const initialDraft: NewFaultContent = {
  plantId: '',
  partId: '',
  typeFault: 'Production',
  comment: '',
};

export const useFaultDraft = create<FaultDraftState>()(
  persist(
    set => ({
      drafts: {},
      setDraft: (userId, draft) =>
        set(state => ({ drafts: { ...state.drafts, [userId]: draft } })),
      clearDraft: userId =>
        set(state => {
          const next = { ...state.drafts };
          delete next[userId];
          return { drafts: next };
        }),
    }),
    {
      name: 'fault-draft',
      partialize: state => ({ drafts: state.drafts }),
    }
  )
);
