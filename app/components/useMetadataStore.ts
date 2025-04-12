import { enableMapSet } from "immer";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { AITrack } from "../lib/ai/aiMetadata";
import type { WebTrack } from "~/lib/tags/musicMetadata";

enableMapSet();

export type StoreTrack = WebTrack;

export interface StoreAlbum {
  name: string;
  artist: string;
  coverArt: string | null;
  directory: string;
}

export type StoreTrackUpdatable = keyof Omit<
  StoreTrack,
  "directory" | "filename" | "duration"
>;

interface MetadataState {
  album: StoreAlbum | null;
  originalAlbum: StoreAlbum | null;
  tracks: StoreTrack[];
  originalTracks: StoreTrack[];
  updatedFields: Record<number, Set<string>>;

  initialize: (
    album: StoreAlbum,
    tracks: StoreTrack[],
    resetOriginal?: boolean,
  ) => void;
  updateAlbumName: (name: string) => void;
  updateAlbumArtist: (artist: string) => void;
  updateTrack: (index: number, field: StoreTrackUpdatable, value: any) => void;
  updateTracks: (tracks: AITrack[]) => void;
  resetChanges: () => void;
}

export const useMetadataStore = create<MetadataState>()(
  immer((set) => ({
    album: null,
    originalAlbum: null,
    tracks: [],
    originalTracks: [],
    updatedFields: {},

    initialize: (album, tracks, resetOriginal = true) =>
      set((state) => {
        state.album = album;
        if (resetOriginal)
          state.originalAlbum = JSON.parse(JSON.stringify(album)); // Deep copy
        state.tracks = tracks;
        if (resetOriginal)
          state.originalTracks = JSON.parse(JSON.stringify(tracks)); // Deep copy
        state.updatedFields = {};
      }),

    updateAlbumName: (name) =>
      set((state) => {
        if (state.album) state.album.name = name;

        // Update the 'album' field in every track, too
        for (let i = 0; i < state.tracks.length; i++) {
          const track = state.tracks[i];

          const oldName = track.album;
          if (oldName !== name) {
            const set = (state.updatedFields[i] ||= new Set<string>());
            set.add("album");
          }

          track.album = name;
        }
      }),

    updateAlbumArtist: (artist) =>
      set((state) => {
        if (state.album) state.album.artist = artist;
      }),

    updateTrack: (index, field, value) =>
      set((state) => {
        if (index >= 0 && index < state.tracks.length) {
          console.log("Updating track", index, "field", field, "value", value);

          // Handle numeric fields
          if (field === "trackNumber" || field === "discNumber") {
            value = parseInt(value, 10) || 1;
          }

          // Update the track field
          (state.tracks[index] as any)[field] = value;

          // Mark this field as updated
          const set = (state.updatedFields[index] ||= new Set<string>());
          set.add(field);
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
              const set = (state.updatedFields[i] ||= new Set<string>());
              set.add(field);
            }
          }
        }
      }),

    resetChanges: () =>
      set((state) => {
        state.tracks = JSON.parse(JSON.stringify(state.originalTracks)); // Deep copy
        state.updatedFields = {};
      }),
  })),
);
