import { NewFaultContent } from '@/types/faultType';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FaultDraft {
  draft: NewFaultContent;
  setDraft: (note: NewFaultContent) => void;
  clearDraft: () => void;
}

const initialDraft: NewFaultContent = {
  plantId: '',
  partId: '',
  comment: '',
};

export const useFaultDraft = create<FaultDraft>()(
  persist(
    set => ({
      draft: initialDraft,
      setDraft: fault => set(() => ({ draft: fault })),
      clearDraft: () => set(() => ({ draft: initialDraft })),
    }),
    {
      name: 'fault-draft',
      partialize: state => ({ draft: state.draft }),
    }
  )
);
