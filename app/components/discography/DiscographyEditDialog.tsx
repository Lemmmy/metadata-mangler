import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useState } from "react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, sourceUrls: string[]) => void;
  isSubmitting: boolean;
  create: boolean;
  name: string;
  sourceUrls: string[];
}

export function DiscographyEditDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  create,
  name,
  sourceUrls,
}: Props) {
  const [editedName, setEditedName] = useState(name);
  const [editedSourceUrls, setEditedSourceUrls] = useState(
    sourceUrls.join("\n"),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{create ? "Add" : "Edit"} discography</DialogTitle>
          <DialogDescription>
            {create
              ? "Add a new discography with a name and source URLs."
              : "Update the discography name and source URLs."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-name" className="text-right">
              Name
            </Label>
            <Input
              id="edit-name"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-sources" className="text-right">
              Sources
            </Label>
            <Textarea
              id="edit-sources"
              value={editedSourceUrls}
              onChange={(e) => setEditedSourceUrls(e.target.value)}
              className="col-span-3"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={() =>
              onSubmit(
                editedName.trim(),
                editedSourceUrls
                  .split("\n")
                  .map((url) => url.trim())
                  .filter((url) => url.length > 0),
              )
            }
            disabled={!editedName.trim() || isSubmitting}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
