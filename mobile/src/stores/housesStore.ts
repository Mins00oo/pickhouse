import { create } from 'zustand';

interface HousesUIState {
  lastViewedHouseId: string | null;
  setLastViewed: (id: string | null) => void;
}

export const useHousesStore = create<HousesUIState>((set) => ({
  lastViewedHouseId: null,
  setLastViewed: (id) => set({ lastViewedHouseId: id }),
}));
