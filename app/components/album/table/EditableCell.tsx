import { Undo2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  useMetadataStore,
  type StoreTrackUpdatable,
} from "~/components/album/useMetadataStore";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface EditableCellProps {
  value: string | number;
  index: number;
  field: keyof StoreTrackUpdatable;
  type?: "text" | "number";
  min?: number;
}

export function EditableCell({
  value,
  field,
  index,
  type = "text",
  min,
}: EditableCellProps) {
  const { originalValue, storeValue, isUpdated, updateTrack } =
    useMetadataStore(
      useShallow((s) => ({
        originalValue: s.originalTracks[index]?.[field],
        storeValue: s.tracks[index]?.[field],
        isUpdated:
          s.originalTracks[index]?.[field] !== s.tracks[index]?.[field],
        updateTrack: s.updateTrack,
      })),
    );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === "number") {
      updateTrack(index, field, parseInt(e.target.value, 10) || min || 1);
    } else {
      updateTrack(index, field, e.target.value);
    }
  };

  const handleReset = () => {
    updateTrack(index, field, originalValue);
  };

  const [inputValue, setInputValue] = useState(value ?? storeValue);
  const internallyUpdated = inputValue !== (value ?? storeValue);
  useEffect(() => {
    setInputValue(value ?? storeValue);
  }, [value, storeValue]);

  return (
    <div className="flex h-full w-full flex-col justify-items-start">
      {/* Input row */}
      <div className="flex w-full flex-1 items-center">
        {/* Text input */}
        <input
          type={type}
          min={min}
          className={cn(
            "w-full flex-1 px-3 py-2",
            "focus:ring-none focus:outline-2 focus:outline-white/50",
            internallyUpdated
              ? "bg-red-600/20"
              : isUpdated
                ? "bg-lime-600/20"
                : "",
          )}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
          }}
          onBlur={(e) => {
            handleChange(e);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") {
              (e.currentTarget as HTMLInputElement).blur();
            }
          }}
        />

        {/* Reset button */}
        {(isUpdated || internallyUpdated) && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            className="h-full flex-shrink-0 rounded-none border-none"
            tabIndex={-1}
          >
            <Undo2 />
          </Button>
        )}
      </div>

      {/* Original value hint */}
      {(isUpdated || internallyUpdated) && originalValue && (
        <div className="mt-1 px-3 text-xs text-white/50">{originalValue}</div>
      )}
    </div>
  );
}
