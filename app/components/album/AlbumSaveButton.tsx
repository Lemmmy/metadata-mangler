import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/lib/trpc";
import { Button } from "../ui/button";
import { Save, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useMetadataStore } from "~/components/album/useMetadataStore";
import type { StoreAlbum } from "./useMetadataStore";
import { cn } from "~/lib/utils";
import { useShallow } from "zustand/react/shallow";

interface Props {
  album: StoreAlbum | null;
}

export function AlbumSaveButton({ album }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const writeTracksMutation = useMutation(
    trpc.album.writeTracks.mutationOptions(),
  );

  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
        trackNumber: track.trackNumber,
        discNumber: track.discNumber,
        title: track.title,
        artists: track.artists,
        album: track.album,
        albumArtist: track.albumArtist,
      }));

      setSaveMessage(null);

      const result = await writeTracksMutation.mutateAsync({
        tracks: tracksToSave,
      });

      if (result.success) {
        setSaveMessage({
          type: "success",
          text: "All tracks saved successfully",
        });

        // Invalidate the album query to reload the data
        if (album.directory) {
          queryClient.invalidateQueries(
            trpc.album.getFromDirectory.queryFilter({
              path: album.directory,
            }),
          );
        }
      } else {
        // Handle error cases
        let errorMessage = "Unknown error";

        if ("errors" in result && result.errors) {
          errorMessage = `Errors: ${result.errors.join(", ")}`;
        } else if ("error" in result && result.error) {
          errorMessage = result.error;
        }

        setSaveMessage({
          type: "error",
          text: errorMessage,
        });
      }
    } catch (error) {
      console.error("Error saving tracks:", error);
      setSaveMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Clear save message after 10 seconds
  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => {
        setSaveMessage(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  return (
    <div className="flex items-center gap-2">
      {saveMessage && (
        <div
          className={cn(
            "text-sm",
            saveMessage.type === "success" ? "text-green-500" : "text-red-500",
          )}
        >
          {saveMessage.text}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={resetChanges}
        disabled={!hasUnsavedChanges}
        className="gap-1"
      >
        <Undo2 className="h-4 w-4" />
        Reset changes
      </Button>

      <Button
        variant={hasUnsavedChanges ? "default" : "outline"}
        size="sm"
        onClick={handleSaveTracks}
        disabled={!album || writeTracksMutation.isPending}
        className="gap-1"
      >
        <Save className="h-4 w-4" />
        {writeTracksMutation.isPending ? "Saving..." : "Save changes"}
      </Button>
    </div>
  );
}
