import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Dialog, DialogTrigger } from "~/components/ui/dialog";
import { ArtistReplacementsDialog } from "./ArtistReplacementsDialog";

export function ArtistReplacementsDialogButton() {
  const [open, setOpen] = useState(false);
  const onClose = () => setOpen(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Replace artists
        </Button>
      </DialogTrigger>

      {open && <ArtistReplacementsDialog onClose={onClose} />}
    </Dialog>
  );
}
