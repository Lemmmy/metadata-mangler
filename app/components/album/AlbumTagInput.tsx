import type { ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { cn } from "~/lib/utils";
import { ResettableInput } from "../ui/input";
import { Label } from "../ui/label";
import { useMetadataStore, type AlbumUpdatable } from "./useMetadataStore";

interface Props<T extends keyof AlbumUpdatable> {
  label: ReactNode;
  field: T;
  className?: string;
  lockable?: boolean;
}

export function AlbumTagInput<T extends keyof AlbumUpdatable>({
  label,
  field,
  className,
  lockable = true,
}: Props<T>) {
  const {
    originalAlbum,
    value,
    update,
    isUpdated,
    locked,
    setAlbumFieldLocked,
  } = useMetadataStore(
    useShallow((s) => ({
      originalAlbum: s.originalAlbum,
      value: s.album?.[field],
      update: s.updateAlbumField,
      isUpdated: s.originalAlbum?.[field] !== s.album?.[field],
      locked: s.lockedAlbumFields[field],
      setAlbumFieldLocked: s.setAlbumFieldLocked,
    })),
  );

  const reset = () => {
    update(field, originalAlbum?.[field] || "");
  };

  const handleLockChange = (locked: boolean) => {
    setAlbumFieldLocked(field, locked);
  };

  return (
    <div className={cn("grid w-full gap-1.5", className)}>
      {/* Label */}
      <Label htmlFor="albumName">{label}</Label>

      <div className="relative mb-4">
        <ResettableInput
          type="text"
          value={value || ""}
          onChange={(e) => update(field, e.target.value)}
          onReset={reset}
          isUpdated={isUpdated}
          locked={locked}
          onLockChange={lockable ? handleLockChange : undefined}
        />

        {/* Original value */}
        {isUpdated && originalAlbum?.[field] && (
          <p className="text-muted-foreground absolute -bottom-6 mt-1 px-3 text-xs">
            {originalAlbum[field]}
          </p>
        )}
      </div>
    </div>
  );
}
