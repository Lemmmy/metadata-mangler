import { enableMapSet, type WritableDraft } from "immer";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { WebTrack, WritableTags } from "~/lib/tags/musicMetadata";
import type { AITrack } from "../../lib/ai/aiMetadata";

enableMapSet();

export type StoreTrack = WebTrack;

export interface StoreAlbum {
  name: string;
  artist: string;
  year: string;
  date: string;
  grouping: string;
  coverArt: string | null;
  directory: string;
  catalogNumber: string | null;
  barcode: string | null;
  albumSubtitle: string | null;
}

export type StoreTrackUpdatable = StoreTrack & WritableTags;

export interface MetadataState {
  album: StoreAlbum | null;
  originalAlbum: StoreAlbum | null;
  tracks: StoreTrack[];
  originalTracks: StoreTrack[];
  updatedFields: Record<number, Record<string, boolean>>;

  urlOrData: string;
  additionalInfo: string;

  initialize: (
    album: StoreAlbum,
    tracks: StoreTrack[],
    resetOriginal?: boolean,
  ) => void;
  updateAlbumName: (name: string) => void;
  updateAlbumArtist: (artist: string) => void;
  updateAlbumYear: (year: string) => void;
  updateAlbumDate: (date: string) => void;
  updateAlbumGrouping: (grouping: string) => void;
  updateAlbumCatalogNumber: (catalogNumber: string) => void;
  updateAlbumBarcode: (barcode: string) => void;
  updateAlbumSubtitle: (albumSubtitle: string) => void;
  updateTrack: (
    index: number,
    field: keyof StoreTrackUpdatable,
    value: any,
  ) => void;
  updateTracks: (tracks: AITrack[]) => void;
  resetChanges: () => void;

  setUrlOrData: (urlOrData: string) => void;
  setAdditionalInfo: (additionalInfo: string) => void;
  setAlbumArt: (albumArt: string | null) => void;
}

// Utility to update album and all tracks for a given field
function updateAlbumAndTracks<
  AF extends keyof StoreAlbum,
  TF extends keyof StoreTrackUpdatable,
>(
  state: WritableDraft<MetadataState>,
  albumField: AF,
  trackField: TF,
  value: StoreAlbum[AF] & StoreTrackUpdatable[TF],
) {
  const album = state.album;
  if (album) {
    album[albumField] = value;
  }

  for (let i = 0; i < state.tracks.length; i++) {
    const track = state.tracks[i];
    const oldVal = track[trackField];
    if (oldVal !== value) {
      const set = (state.updatedFields[i] ||= {});
      set[trackField] = true;
    }
    track[trackField] = value;
  }
}

export const useMetadataStore = create<MetadataState>()(
  immer((set) => ({
    album: null,
    originalAlbum: null,
    tracks: [],
    originalTracks: [],
    updatedFields: {},
    urlOrData: "",
    additionalInfo: "",

    initialize: (album, tracks, resetOriginal = true) =>
      set((state) => {
        state.album = album;
        if (resetOriginal)
          state.originalAlbum = JSON.parse(JSON.stringify(album)); // Deep copy
        state.tracks = tracks;
        if (resetOriginal)
          state.originalTracks = JSON.parse(JSON.stringify(tracks)); // Deep copy
        state.updatedFields = {};
        state.urlOrData = "";
        state.additionalInfo = "";
      }),

    updateAlbumName: (name) =>
      set((state) => {
        updateAlbumAndTracks(state, "name", "album", name);
      }),

    updateAlbumArtist: (artist) =>
      set((state) => {
        updateAlbumAndTracks(state, "artist", "albumArtist", artist);
      }),

    updateAlbumYear: (year) =>
      set((state) => {
        updateAlbumAndTracks(state, "year", "year", year);
      }),

    updateAlbumDate: (date) =>
      set((state) => {
        updateAlbumAndTracks(state, "date", "date", date);
      }),

    updateAlbumGrouping: (grouping) =>
      set((state) => {
        updateAlbumAndTracks(state, "grouping", "grouping", grouping);
      }),

    updateAlbumCatalogNumber: (catalogNumber) =>
      set((state) => {
        updateAlbumAndTracks(
          state,
          "catalogNumber",
          "catalogNumber",
          catalogNumber,
        );
      }),

    updateAlbumBarcode: (barcode) =>
      set((state) => {
        updateAlbumAndTracks(state, "barcode", "barcode", barcode);
      }),

    updateAlbumSubtitle: (albumSubtitle) =>
      set((state) => {
        updateAlbumAndTracks(
          state,
          "albumSubtitle",
          "albumSubtitle",
          albumSubtitle,
        );
      }),

    updateTrack: (index, field, value) =>
      set((state) => {
        if (index >= 0 && index < state.tracks.length) {
          // Handle numeric fields
          if (field === "trackNumber" || field === "discNumber") {
            value = parseInt(value, 10) || 1;
          }

          // Update the track field
          (state.tracks[index] as any)[field] = value;

          // Mark this field as updated
          const set = (state.updatedFields[index] ||= {});
          set[field] = true;
        } else {
          console.warn(
            "Invalid index for updateTrack:",
            index,
            "tracks length:",
            state.tracks.length,
          );
        }
      }),

    // Merge the AI lookup results into the table fields, bumping updatedFields if any changed along the way
    updateTracks: (newTracks) =>
      set((state) => {
        const originalTracks = state.tracks;
        for (let i = 0; i < newTracks.length; i++) {
          const newTrack = newTracks[i];
          const originalTrack = originalTracks[i];

          for (const field in newTrack) {
            if (
              newTrack[field as keyof AITrack] !==
              originalTrack[field as keyof StoreTrack]
            ) {
              (originalTrack as any)[field] = newTrack[field as keyof AITrack];
              const set = (state.updatedFields[i] ||= {});
              set[field] = true;
            }
          }
        }
      }),

    resetChanges: () =>
      set((state) => {
        state.tracks = JSON.parse(JSON.stringify(state.originalTracks)); // Deep copy
        state.album = JSON.parse(JSON.stringify(state.originalAlbum)); // Deep copy
        state.updatedFields = {};
      }),

    setUrlOrData: (urlOrData: string) =>
      set((state) => {
        state.urlOrData = urlOrData;
      }),

    setAdditionalInfo: (additionalInfo: string) =>
      set((state) => {
        state.additionalInfo = additionalInfo;
      }),

    setAlbumArt: (albumArt: string | null) =>
      set((state) => {
        if (state.album) state.album.coverArt = albumArt;
      }),
  })),
);
