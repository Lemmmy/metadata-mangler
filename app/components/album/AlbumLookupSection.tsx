import { useMutation } from "@tanstack/react-query";
import type { VisibilityState } from "@tanstack/react-table";
import { type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import {
  useMetadataStore,
  type AlbumUpdatable,
  type StoreAlbum,
} from "~/components/album/useMetadataStore";
import { ColumnVisibilityDropdown } from "~/components/table/ColumnVisibilityDropdown";
import { useModelPicker } from "~/components/useModelPicker";
import type { PriceUsage } from "~/lib/ai/aiProviders";
import { useTRPC } from "~/lib/trpc";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { AlbumLookupButton, type HandleLookupFn } from "./AlbumLookupButton";
import { AlbumSyncedBrowserButton } from "./AlbumSyncedBrowserButton";
import { ArtistAddButton } from "./replacements/ArtistAddButton";
import { ArtistRemoveButton } from "./replacements/ArtistRemoveButton";
import { ArtistReplacementsDialogButton } from "./replacements/ArtistReplacementsDialogButton";
import { MusicBrainzSearchDialogButton } from "./search/MusicBrainzSearchDialogButton";
import { VgmdbSearchDialogButton } from "./search/VgmdbSearchDialogButton";
import { albumTableColumns } from "./table/useAlbumTableColumns";

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
    updateAlbumField,
    updateTracks,
    urlOrData,
    additionalInfo,
    setUrlOrData,
    setAdditionalInfo,
  } = useMetadataStore(
    useShallow((s) => ({
      updateAlbumField: s.updateAlbumField,
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
        const res = result; // narrow the type
        function update(
          resultField: keyof typeof res,
          field: keyof AlbumUpdatable,
          value: any,
        ) {
          // update the album field if it changed and if it isn't locked
          if (res[resultField] && !bareState.lockedAlbumFields[field]) {
            updateAlbumField(field, value);
          }
        }

        // album-specific fields
        update("albumName", "name", res.albumName);
        update("albumArtist", "artist", res.albumArtist);
        update("year", "year", res.year);
        update("date", "date", res.date);
        update("catalogNumber", "catalogNumber", res.catalogNumber);
        update("barcode", "barcode", res.barcode);

        // tracks
        updateTracks(res.tracks);
      } else if (!result.success && "error" in result && result.error) {
        console.error("Error from lookup:", result.error);
        toast.error("Error during lookup, see console for details");
      }
    } catch (error) {
      console.error("Error during lookup:", error);
      toast.error("Error during lookup, see console for details");
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
          {/* Lookup button & settings dropdown */}
          <AlbumLookupButton
            handleLookup={handleLookup}
            canLookup={urlOrData.trim() !== ""}
            isPending={lookupMutation.isPending}
          />

          {modelPicker}

          <VgmdbSearchDialogButton
            dirName={dirName}
            onConfirm={(url) => setUrlOrData(url)}
          />
          <MusicBrainzSearchDialogButton
            dirName={dirName}
            onConfirm={(url) => setUrlOrData(url)}
          />
          <AlbumSyncedBrowserButton />

          {/* Spacer */}
          <div className="flex-1" />

          <ArtistAddButton />
          <ArtistRemoveButton />

          <ArtistReplacementsDialogButton />

          <ColumnVisibilityDropdown
            columns={albumTableColumns}
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
          />
        </div>
      </div>
    </div>
  );
}
