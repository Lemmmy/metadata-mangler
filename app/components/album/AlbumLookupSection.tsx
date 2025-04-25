import { useMutation } from "@tanstack/react-query";
import type { VisibilityState } from "@tanstack/react-table";
import { type Dispatch, type SetStateAction } from "react";
import { useShallow } from "zustand/react/shallow";
import { ColumnVisibilityDropdown } from "~/components/album/table/ColumnVisibilityDropdown";
import {
  useMetadataStore,
  type StoreAlbum,
} from "~/components/album/useMetadataStore";
import { useModelPicker } from "~/components/useModelPicker";
import type { PriceUsage } from "~/lib/ai/aiProviders";
import { useTRPC } from "~/lib/trpc";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { ArtistAddButton } from "./replacements/ArtistAddButton";
import { ArtistReplacementsDialogButton } from "./replacements/ArtistReplacementsDialogButton";
import { MusicBrainzSearchDialogButton } from "./search/MusicBrainzSearchDialogButton";
import { VgmdbSearchDialogButton } from "./search/VgmdbSearchDialogButton";
import {
  useAlbumLookupSettings,
  type HandleLookupFn,
} from "./useAlbumLookupSettings";

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
    updateAlbumCatalogNumber,
    updateAlbumBarcode,
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
      updateAlbumCatalogNumber: s.updateAlbumCatalogNumber,
      updateAlbumBarcode: s.updateAlbumBarcode,
      updateTracks: s.updateTracks,
      urlOrData: s.urlOrData,
      additionalInfo: s.additionalInfo,
      setUrlOrData: s.setUrlOrData,
      setAdditionalInfo: s.setAdditionalInfo,
    })),
  );

  const handleLookup: HandleLookupFn = async (
    enableAI,
    inheritYear,
    inheritDate,
    inheritCatalogNumber,
    inheritBarcode,
  ) => {
    if (!urlOrData.trim()) return;

    setUsage(null);

    try {
      const bareState = useMetadataStore.getState();
      const tracks = bareState.tracks;

      const result = await lookupMutation.mutateAsync({
        input: urlOrData,
        albumName: album?.name || "",
        albumArtist: album?.artist || "",
        tracks,
        settings: {
          enableAI,
          aiSettings: {
            modelId: selectedModel,
            additionalInfo: additionalInfo || undefined,
          },
          inheritSupplementalFields: {
            year: inheritYear,
            date: inheritDate,
            catalogNumber: inheritCatalogNumber,
            barcode: inheritBarcode,
          },
        },
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
        if (result.catalogNumber)
          updateAlbumCatalogNumber(result.catalogNumber);
        if (result.barcode) updateAlbumBarcode(result.barcode);

        updateTracks(result.tracks);
      } else if (!result.success && "error" in result && result.error) {
        console.error("Error from lookup:", result.error);
      }
    } catch (error) {
      console.error("Error during lookup:", error);
    }
  };

  const lookupButton = useAlbumLookupSettings(
    handleLookup,
    urlOrData.trim() !== "",
    lookupMutation.isPending,
  );

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
          {/* Lookup button & settings dropdown */}
          {lookupButton}

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
