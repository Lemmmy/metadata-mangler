import { useAsyncThrottler } from "@tanstack/react-pacer";
import { useMutation } from "@tanstack/react-query";
import type { VisibilityState } from "@tanstack/react-table";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  useMetadataStore,
  type StoreAlbum,
} from "~/components/useMetadataStore";
import type { PriceUsage } from "~/lib/ai/aiProviders";
import { useTRPC } from "~/lib/trpc";
import { ColumnVisibilityDropdown } from "./ColumnVisibilityDropdown";
import { ModelUsage } from "./ModelEstimate";
import { Button } from "./ui/button";
import { useModelPicker } from "./useModelPicker";

interface Props {
  album: StoreAlbum | null;
  className?: string;
  columnVisibility: VisibilityState;
  setColumnVisibility: Dispatch<SetStateAction<VisibilityState>>;
}

export function AlbumLookupSection({
  album,
  className,
  columnVisibility,
  setColumnVisibility,
}: Props) {
  const trpc = useTRPC();
  const lookupMutation = useMutation(trpc.metadata.lookup.mutationOptions());
  const estimateMutation = useMutation(trpc.metadata.lookup.mutationOptions());

  const [urlOrData, setUrlOrData] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [selectedModel, modelPicker] = useModelPicker();

  const [usage, setUsage] = useState<PriceUsage | null>(null);

  const { updateAlbumName, updateAlbumArtist, updateTracks } = useMetadataStore(
    useShallow((s) => ({
      updateAlbumName: s.updateAlbumName,
      updateAlbumArtist: s.updateAlbumArtist,
      updateTracks: s.updateTracks,
    })),
  );

  const estimateThrottler = useAsyncThrottler(
    async (
      urlOrData: string,
      additionalInfo: string,
      selectedModel: string,
      album: StoreAlbum | null,
    ) => {
      console.log("estimateThrottler called with", {
        urlOrData,
        selectedModel,
        album,
      });
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
        if (result.albumName) {
          updateAlbumName(result.albumName);
        }

        if (result.albumArtist) {
          updateAlbumArtist(result.albumArtist);
        }

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
      console.log("Estimating...");
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
          <div>
            <label className="text-muted-foreground mb-1 block text-sm font-medium">
              URL or supplementary track information
            </label>
            <textarea
              value={urlOrData}
              onChange={(e) => setUrlOrData(e.target.value)}
              placeholder="Enter a compatible URL (VGMDB, MusicBrainz, Bandcamp, etc.) or full-text supplementary track information"
              className="border-input bg-background text-foreground placeholder-muted-foreground w-full rounded-md border p-2 text-sm"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="text-muted-foreground mb-1 block text-sm font-medium">
              Additional information
            </label>
            <textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Provide additional information to the model"
              className="border-input bg-background text-foreground placeholder-muted-foreground w-full rounded-md border p-2 text-sm"
              rows={3}
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
            pending={estimateMutation.isPending}
          />

          <ColumnVisibilityDropdown
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
          />
        </div>
      </div>
    </div>
  );
}
