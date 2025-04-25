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
export type AlbumUpdatable = Omit<StoreAlbum, "coverArt">;

export const albumTrackFieldMap: Record<
  keyof AlbumUpdatable,
  keyof StoreTrackUpdatable
> = {
  name: "album",
  artist: "albumArtist",
  year: "year",
  date: "date",
  grouping: "grouping",
  directory: "directory",
  catalogNumber: "catalogNumber",
  barcode: "barcode",
  albumSubtitle: "albumSubtitle",
};

export interface MetadataState {
  album: StoreAlbum | null;
  originalAlbum: StoreAlbum | null;
  tracks: StoreTrack[];
  originalTracks: StoreTrack[];
  updatedFields: Record<number, Record<string, boolean>>;
  lockedAlbumFields: Record<string, boolean>;

  urlOrData: string;
  additionalInfo: string;

  initialize: (
    album: StoreAlbum,
    tracks: StoreTrack[],
    resetOriginal?: boolean,
  ) => void;
  updateAlbumField: (field: keyof AlbumUpdatable, value: any) => void;
  updateTrack: (
    index: number,
    field: keyof StoreTrackUpdatable,
    value: any,
  ) => void;
  updateTracks: (tracks: AITrack[]) => void;
  setAlbumFieldLocked: (field: keyof StoreAlbum, locked: boolean) => void;
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
    lockedAlbumFields: {},
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

    updateAlbumField: (field, value) =>
      set((state) => {
        updateAlbumAndTracks(state, field, albumTrackFieldMap[field], value);
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

    setAlbumFieldLocked: (field, locked) =>
      set((state) => {
        const set = (state.lockedAlbumFields ||= {});
        set[field] = locked;
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
