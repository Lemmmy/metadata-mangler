import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { useMetadataStore } from "../useMetadataStore";
import { MusicBrainzSearchDialog } from "./MusicBrainzSearchDialog";

export function MusicBrainzSearchDialogButton({
  onConfirm: rawOnConfirm,
  dirName,
}: {
  onConfirm: (url: string) => void;
  dirName: string;
}) {
  const [open, setOpen] = useState(false);

  const { albumName, albumArtist, catalogNumberTag, tracks } = useMetadataStore(
    useShallow((s) => ({
      albumName: s.album?.name || "",
      albumArtist: s.album?.artist || "",
      catalogNumberTag: s.album?.catalogNumber || "",
      tracks: s.tracks,
    })),
  );

  const onConfirm = (url: string) => {
    rawOnConfirm(url);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          Search MusicBrainz
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full min-w-[480px] md:max-w-[1024px]">
        <DialogHeader>
          <DialogTitle>Search MusicBrainz</DialogTitle>
          <VisuallyHidden asChild>
            <DialogDescription>Search by album name</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        {open && (
          <MusicBrainzSearchDialog
            onConfirm={onConfirm}
            albumName={albumName}
            albumArtist={albumArtist}
            dirName={dirName}
            catalogNumberTag={catalogNumberTag}
            tracks={tracks}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
