import { useAsyncThrottler } from "@tanstack/react-pacer";
import { useMutation } from "@tanstack/react-query";
import type { VisibilityState } from "@tanstack/react-table";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useShallow } from "zustand/react/shallow";
import { ColumnVisibilityDropdown } from "~/components/album/table/ColumnVisibilityDropdown";
import {
  useMetadataStore,
  type StoreAlbum,
} from "~/components/album/useMetadataStore";
import { ModelUsage } from "~/components/ModelEstimate";
import { Button } from "~/components/ui/button";
import { useModelPicker } from "~/components/useModelPicker";
import type { PriceUsage } from "~/lib/ai/aiProviders";
import { useTRPC } from "~/lib/trpc";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { VgmdbSearchDialogButton } from "./search/VgmdbSearchDialogButton";
import { ArtistReplacementsDialogButton } from "./replacements/ArtistReplacementsDialogButton";
import { ArtistAddButton } from "./replacements/ArtistAddButton";

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
  const estimateMutation = useMutation(trpc.metadata.lookup.mutationOptions());

  const [selectedModel, modelPicker] = useModelPicker();

  const [usage, setUsage] = useState<PriceUsage | null>(null);

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

  const estimateThrottler = useAsyncThrottler(
    async (
      urlOrData: string,
      additionalInfo: string,
      selectedModel: string,
      album: StoreAlbum | null,
    ) => {
      if (!urlOrData.trim()) return;

      try {
        const bareState = useMetadataStore.getState();
        const tracks = bareState.tracks;

        estimateMutation.mutate({
          input: urlOrData,
          additionalInfo: additionalInfo || undefined,
          modelId: selectedModel,
          albumName: album?.name || "",
          albumArtist: album?.artist || "",
          tracks,
          estimateOnly: true,
        });
      } catch (error) {
        console.error("Error during lookup:", error);
      }
    },
    {
      wait: 500,
    },
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

  useEffect(() => {
    if (urlOrData.trim() && album) {
      estimateThrottler.maybeExecute(
        urlOrData,
        additionalInfo,
        selectedModel,
        album,
      );
    }
  }, [urlOrData, additionalInfo, album, estimateThrottler, selectedModel]);

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
          <ModelUsage
            isEstimate={!usage}
            usage={(usage || estimateMutation.data) as PriceUsage}
          />

          <VgmdbSearchDialogButton
            albumName={album?.name || ""}
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
