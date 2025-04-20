import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import React, { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "~/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { ResettableInput } from "~/components/ui/input";
import { useMetadataStore } from "../useMetadataStore";
import { useTRPC } from "~/lib/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRightLeft, Loader2 } from "lucide-react";

export interface ArtistReplacementsDialogProps {
  onClose: () => void;
}

export function ArtistReplacementsDialog({
  onClose,
}: ArtistReplacementsDialogProps) {
  const [replacements, setReplacements] = useState<Record<string, string>>({});

  const tracks = useMetadataStore(useShallow((s) => s.tracks));
  const initialReplacements = useMemo(
    () =>
      tracks.reduce(
        (acc, track) => {
          track.artists.split(/;\s*/).forEach((artist) => {
            acc[artist.trim()] = artist.trim();
          });
          return acc;
        },
        {} as Record<string, string>,
      ),
    [tracks],
  );
  useEffect(() => {
    setReplacements(initialReplacements);
  }, [initialReplacements]);

  const trpc = useTRPC();
  const { data: replacementsData, isLoading } = useQuery(
    trpc.replacements.getArtistReplacements.queryOptions({
      artists: Object.keys(initialReplacements),
    }),
  );
  const { mutateAsync: saveReplacements, isPending } = useMutation(
    trpc.replacements.saveArtistReplacements.mutationOptions(),
  );

  useEffect(() => {
    // Populate the server-sided replacements on load
    if (replacementsData) {
      for (const { original, replacement } of replacementsData) {
        setReplacements((r) => ({ ...r, [original]: replacement }));
      }
    }
  }, [replacementsData]);

  const handleReplace = () => {
    saveReplacements({
      replacements: Object.entries(replacements).map(
        ([original, replacement]) => ({
          original,
          replacement,
        }),
      ),
    })
      .then(({ success }) => {
        if (!success) {
          throw new Error("Failed to save replacements");
        }

        // Update the metadata store
        const state = useMetadataStore.getState();
        for (let i = 0; i < state.tracks.length; i++) {
          const track = state.tracks[i];
          const newArtists = track.artists
            .split(/;\s*/)
            .map((artist) => replacements[artist.trim()] || artist.trim())
            .join("; ");
          state.updateTrack(i, "artists", newArtists);
        }

        onClose();
      })
      .catch(console.error);
  };

  return (
    <DialogContent className="w-full min-w-[480px] md:max-w-[640px]">
      <DialogHeader>
        <DialogTitle>Replace artists</DialogTitle>
        <VisuallyHidden asChild>
          <DialogDescription>Replace artist names in bulk</DialogDescription>
        </VisuallyHidden>
      </DialogHeader>

      <div className="grid max-h-[480px] grid-cols-2 gap-x-2 gap-y-1 overflow-y-scroll">
        {Object.entries(replacements).map(([original, replacement]) => (
          <React.Fragment key={original}>
            <ResettableInput
              value={replacement}
              isUpdated={original !== replacement}
              onChange={(e) =>
                setReplacements((r) => ({ ...r, [original]: e.target.value }))
              }
              onReset={() =>
                setReplacements((r) => ({ ...r, [original]: original }))
              }
              extra={
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setReplacements((r) => ({
                      ...r,
                      [original]: swapNames(replacement),
                    }))
                  }
                >
                  <ArrowRightLeft />
                </Button>
              }
            />
          </React.Fragment>
        ))}
      </div>

      <DialogFooter>
        {isLoading && (
          <Loader2 className="text-muted-foreground size-4 animate-spin" />
        )}

        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>

        <Button onClick={handleReplace} disabled={isPending}>
          Replace
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function swapNames(input: string) {
  return input.replace(/(\w+)\s+(\w+)/, "$2 $1");
}
