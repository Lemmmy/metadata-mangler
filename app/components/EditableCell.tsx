import { useShallow } from "zustand/react/shallow";
import {
  useMetadataStore,
  type StoreTrackUpdatable,
} from "~/components/useMetadataStore";
import { cn } from "~/lib/utils";

interface EditableCellProps {
  value: string | number;
  index: number;
  field: StoreTrackUpdatable;
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

  return (
    <div className="flex h-full w-full flex-col justify-items-start">
      <input
        type={type}
        min={min}
        className={cn(
          "w-full flex-1 px-3 py-2",
          "focus:ring-none focus:outline-2 focus:outline-white/50",
          isUpdated && "bg-lime-600/20",
        )}
        value={storeValue ?? value}
        onChange={handleChange}
      />
      {isUpdated && originalValue && (
        <div className="mt-1 px-3 text-xs text-white/50">{originalValue}</div>
      )}
    </div>
  );
}
