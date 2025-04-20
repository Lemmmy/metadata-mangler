import type { ReactNode } from "react";
import {
  useMetadataStore,
  type StoreAlbum,
  type MetadataState,
} from "./useMetadataStore";
import { useShallow } from "zustand/react/shallow";
import type { PickByValue } from "utility-types";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { cn } from "~/lib/utils";
import { Button } from "../ui/button";
import { Undo2 } from "lucide-react";

interface Props<T extends keyof StoreAlbum> {
  label: ReactNode;
  field: T;
  updater: keyof PickByValue<MetadataState, (input: string) => void>;
  className?: string;
}

export function AlbumTagInput<T extends keyof StoreAlbum>({
  label,
  field,
  updater,
  className,
}: Props<T>) {
  const { originalAlbum, value, update, isUpdated } = useMetadataStore(
    useShallow((s) => ({
      originalAlbum: s.originalAlbum,
      value: s.album?.[field],
      update: s[updater],
      isUpdated: s.originalAlbum?.[field] !== s.album?.[field],
    })),
  );

  const reset = () => {
    update(originalAlbum?.[field] || "");
  };

  return (
    <div className={cn("grid w-full gap-1.5", className)}>
      {/* Label */}
      <Label htmlFor="albumName">{label}</Label>

      <div className="relative mb-4">
        <div className="flex items-center">
          {/* Input */}
          <Input
            type="text"
            className={cn(
              "rounded-r-none",
              isUpdated && "bg-lime-600/20 dark:bg-lime-600/20",
            )}
            value={value || ""}
            onChange={(e) => update(e.target.value)}
          />

          {/* Reset button */}
          <Button
            variant="outline"
            size="icon"
            onClick={reset}
            disabled={!isUpdated}
            className="rounded-l-none border-l-0"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
        </div>

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
