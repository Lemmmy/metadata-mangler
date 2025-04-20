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
import {
  VgmdbSearchDialog,
  type VgmdbSearchDialogProps,
} from "./VgmdbSearchDialog";

export function VgmdbSearchDialogButton({
  onConfirm: rawOnConfirm,
  ...props
}: VgmdbSearchDialogProps) {
  const [open, setOpen] = useState(false);

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

        <VgmdbSearchDialog {...props} onConfirm={onConfirm} />
      </DialogContent>
    </Dialog>
  );
}
