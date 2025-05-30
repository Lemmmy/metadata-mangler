import type { RowSelectionState, Updater } from "@tanstack/react-table";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist, createJSONStorage } from "zustand/middleware";
import type { WebDiscographyRelease } from "~/api/discography";

export interface DiscographyState {
  discographyId: string;
  includeIgnoredVgmdbRoles: Record<string, boolean>;
  releases: WebDiscographyRelease[];
  selectedReleaseIds: RowSelectionState;

  initialize: (
    discographyId: string,
    releases: WebDiscographyRelease[],
  ) => void;

  setIncludeIgnoredVgmdbRoles: (include: boolean) => void;
  setSelectedReleaseIds: (ids: Updater<RowSelectionState>) => void;
}

export const useDiscographyStore = create<DiscographyState>()(
  persist(
    immer((set) => ({
      discographyId: "",
      includeIgnoredVgmdbRoles: {},
      releases: [],
      selectedReleaseIds: {},

      initialize: (discographyId, releases) =>
        set((state) => {
          state.discographyId = discographyId;
          state.releases = releases;
          state.selectedReleaseIds = {};
        }),

      setIncludeIgnoredVgmdbRoles: (include) =>
        set((state) => {
          state.includeIgnoredVgmdbRoles[state.discographyId] = include;
        }),

      setSelectedReleaseIds: (updater) =>
        set((state) => {
          if (typeof updater === "function") {
            state.selectedReleaseIds = updater(state.selectedReleaseIds);
          } else {
            state.selectedReleaseIds = updater;
          }
        }),
    })),
    {
      name: "discography",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        includeIgnoredVgmdbRoles: state.includeIgnoredVgmdbRoles,
      }),
    },
  ),
);
