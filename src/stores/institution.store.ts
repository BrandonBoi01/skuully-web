import { create } from "zustand";

type InstitutionState = {
  institutionId: string | null;
  setInstitution: (id: string) => void;
};

export const useInstitutionStore = create<InstitutionState>((set) => ({
  institutionId: null,
  setInstitution: (id) => set({ institutionId: id }),
}));