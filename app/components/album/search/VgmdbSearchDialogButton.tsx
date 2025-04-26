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
import { VgmdbSearchDialog } from "./VgmdbSearchDialog";

export function VgmdbSearchDialogButton({
  onConfirm: rawOnConfirm,
  dirName,
}: {
  onConfirm: (id: string) => void;
  dirName: string;
}) {
  const [open, setOpen] = useState(false);

  const { albumName, catalogNumberTag } = useMetadataStore(
    useShallow((s) => ({
      albumName: s.album?.name || "",
      catalogNumberTag: s.album?.catalogNumber || "",
    })),
  );

  const onConfirm = (id: string) => {
    rawOnConfirm(id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          Search VGMdb
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full min-w-[480px] md:max-w-[1024px]">
        <DialogHeader>
          <DialogTitle>Search VGMdb</DialogTitle>
          <VisuallyHidden asChild>
            <DialogDescription>Search by album name</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        {open && (
          <VgmdbSearchDialog
            onConfirm={onConfirm}
            albumName={albumName}
            dirName={dirName}
            catalogNumberTag={catalogNumberTag}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
