import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { MusicBrainzSearchDialog } from "./MusicBrainzSearchDialog";

export function MusicBrainzSearchDialogButton({
  onConfirm: rawOnConfirm,
  dirName,
}: {
  onConfirm: (url: string) => void;
  dirName: string;
}) {
  const [open, setOpen] = useState(false);

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
          <MusicBrainzSearchDialog onConfirm={onConfirm} dirName={dirName} />
        )}
      </DialogContent>
    </Dialog>
  );
}
