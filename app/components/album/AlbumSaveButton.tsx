import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { useMetadataStore } from "~/components/album/useMetadataStore";
import { useTRPC } from "~/lib/trpc";
import { Button } from "../ui/button";
import type { StoreAlbum } from "./useMetadataStore";

interface Props {
  album: StoreAlbum | null;
  path: string;
}

export function AlbumSaveButton({ album, path }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const writeTracksMutation = useMutation(
    trpc.album.writeTracks.mutationOptions(),
  );

  const { hasUnsavedChanges, resetChanges } = useMetadataStore(
    useShallow((s) => ({
      hasUnsavedChanges: Object.values(s.updatedFields).some((set) =>
        Object.values(set).some((v) => v),
      ),
      resetChanges: s.resetChanges,
    })),
  );

  const handleSaveTracks = async () => {
    if (!album) return;

    try {
      const bareState = useMetadataStore.getState();
      const tracks = bareState.tracks;

      // Prepare tracks for saving
      const tracksToSave = tracks.map((track) => ({
        filePath: track.directory + "/" + track.filename, // Construct full file path
        ...track,
      }));

      const result = await writeTracksMutation.mutateAsync({
        tracks: tracksToSave,
      });

      if (result.success) {
        toast.success("All tracks saved successfully");

        // Invalidate the album query to reload the data
        queryClient.invalidateQueries(
          trpc.album.getFromDirectory.queryFilter({
            path,
          }),
        );
      } else {
        // Handle error cases
        let errorMessage = "Unknown error";

        if ("errors" in result && result.errors) {
          errorMessage = `Errors: ${result.errors.join(", ")}`;
        } else if ("error" in result && result.error) {
          errorMessage = result.error;
        }

        console.error("Error saving tracks:", errorMessage);
        toast.error("Error saving tracks, see console for details");
      }
    } catch (error) {
      console.error("Error saving tracks:", error);
      toast.error("Error saving tracks, see console for details");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={resetChanges}
        disabled={!hasUnsavedChanges}
        className="gap-1"
      >
        <Undo2 />
        Reset changes
      </Button>

      <Button
        variant={hasUnsavedChanges ? "default" : "outline"}
        size="sm"
        onClick={handleSaveTracks}
        disabled={!album || writeTracksMutation.isPending}
        className="gap-1"
      >
        {writeTracksMutation.isPending ? (
          <Loader2 className="spin" />
        ) : (
          <Save />
        )}
        Save changes
      </Button>
    </div>
  );
}
