import { create } from 'zustand';

interface PageStore {
  pageTitle: string;
  setPageTitle: (title: string) => void;
}

export const usePageStore = create<PageStore>(set => ({
  pageTitle: '',
  setPageTitle: (title: string) => set({ pageTitle: title }),
}));
