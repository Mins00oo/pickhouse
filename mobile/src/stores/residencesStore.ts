import { create } from 'zustand';

interface ResidencesUIState {
  currentResidenceId: string | null;
  setCurrent: (id: string | null) => void;
}

export const useResidencesStore = create<ResidencesUIState>((set) => ({
  currentResidenceId: null,
  setCurrent: (id) => set({ currentResidenceId: id }),
}));
