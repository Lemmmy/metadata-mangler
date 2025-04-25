import { useMutation } from "@tanstack/react-query";
import type { VisibilityState } from "@tanstack/react-table";
import { type Dispatch, type SetStateAction } from "react";
import { useShallow } from "zustand/react/shallow";
import { ColumnVisibilityDropdown } from "~/components/album/table/ColumnVisibilityDropdown";
import {
  useMetadataStore,
  type StoreAlbum,
} from "~/components/album/useMetadataStore";
import { Button } from "~/components/ui/button";
import { useModelPicker } from "~/components/useModelPicker";
import type { PriceUsage } from "~/lib/ai/aiProviders";
import { useTRPC } from "~/lib/trpc";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { ArtistAddButton } from "./replacements/ArtistAddButton";
import { ArtistReplacementsDialogButton } from "./replacements/ArtistReplacementsDialogButton";
import { MusicBrainzSearchDialogButton } from "./search/MusicBrainzSearchDialogButton";
import { VgmdbSearchDialogButton } from "./search/VgmdbSearchDialogButton";

interface Props {
  album: StoreAlbum | null;
  dirName: string;
  className?: string;
  columnVisibility: VisibilityState;
  setColumnVisibility: Dispatch<SetStateAction<VisibilityState>>;
}

export function AlbumLookupSection({
  album,
  dirName,
  className,
  columnVisibility,
  setColumnVisibility,
}: Props) {
  const trpc = useTRPC();
  const lookupMutation = useMutation(trpc.metadata.lookup.mutationOptions());

  const { selectedModel, modelPicker, setUsage } = useModelPicker();

  const {
    updateAlbumName,
    updateAlbumArtist,
    updateAlbumYear,
    updateAlbumDate,
    updateTracks,
    urlOrData,
    additionalInfo,
    setUrlOrData,
    setAdditionalInfo,
  } = useMetadataStore(
    useShallow((s) => ({
      updateAlbumName: s.updateAlbumName,
      updateAlbumArtist: s.updateAlbumArtist,
      updateAlbumYear: s.updateAlbumYear,
      updateAlbumDate: s.updateAlbumDate,
      updateTracks: s.updateTracks,
      urlOrData: s.urlOrData,
      additionalInfo: s.additionalInfo,
      setUrlOrData: s.setUrlOrData,
      setAdditionalInfo: s.setAdditionalInfo,
    })),
  );

  const handleLookup = async () => {
    if (!urlOrData.trim()) return;

    setUsage(null);

    try {
      const bareState = useMetadataStore.getState();
      const tracks = bareState.tracks;

      const result = await lookupMutation.mutateAsync({
        input: urlOrData,
        additionalInfo: additionalInfo || undefined,
        modelId: selectedModel,
        albumName: album?.name || "",
        albumArtist: album?.artist || "",
        tracks,
      });

      if (result.success && "promptTokens" in result) {
        setUsage(result as PriceUsage);
      }

      // Update edited tracks with the new metadata
      if (result.success && "tracks" in result && result.tracks) {
        if (result.albumName) updateAlbumName(result.albumName);
        if (result.albumArtist) updateAlbumArtist(result.albumArtist);
        if (result.year) updateAlbumYear(result.year);
        if (result.date) updateAlbumDate(result.date);

        updateTracks(result.tracks);
      } else if (!result.success && "error" in result && result.error) {
        console.error("Error from lookup:", result.error);
      }
    } catch (error) {
      console.error("Error during lookup:", error);
    }
  };

  return (
    <div className={className}>
      <h3 className="text-lg font-medium">Metadata lookup</h3>
      <div className="mt-2 space-y-3">
        <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="urlOrData">
              URL or supplementary track information
            </Label>
            <Textarea
              value={urlOrData}
              onChange={(e) => setUrlOrData(e.target.value)}
              placeholder="Enter a compatible URL (VGMDB, MusicBrainz, Bandcamp, etc.) or full-text supplementary track information"
              rows={3}
              required
              className="h-[64px] overflow-y-scroll"
            />
          </div>

          <div className="grid w-full gap-1.5">
            <Label htmlFor="additionalInfo">Additional information</Label>
            <Textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Provide additional information to the model"
              rows={3}
              className="h-[64px] overflow-y-scroll"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleLookup}
            disabled={!urlOrData.trim() || lookupMutation.isPending}
          >
            {lookupMutation.isPending ? "Processing..." : "Lookup"}
          </Button>

          {lookupMutation.isError && (
            <div className="mt-2 text-sm text-red-500">
              Error: {lookupMutation.error?.message || "Unknown error"}
            </div>
          )}

          {modelPicker}

          <VgmdbSearchDialogButton
            dirName={dirName}
            onConfirm={(url) => setUrlOrData(url)}
          />
          <MusicBrainzSearchDialogButton
            dirName={dirName}
            onConfirm={(url) => setUrlOrData(url)}
          />

          {/* Spacer */}
          <div className="flex-1" />

          <ArtistAddButton />

          <ArtistReplacementsDialogButton />

          <ColumnVisibilityDropdown
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
          />
        </div>
      </div>
    </div>
  );
}
