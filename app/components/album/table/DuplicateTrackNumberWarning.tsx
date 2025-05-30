import { useShallow } from "zustand/react/shallow";
import { useMetadataStore } from "../useMetadataStore";
import type { ReactElement } from "react";

export function DuplicateTrackNumberWarning(): ReactElement | null {
  const { tracks } = useMetadataStore(
    useShallow((s) => ({
      tracks: s.tracks,
    })),
  );

  const duplicateTrackNumber = tracks
    .map((t) => `${t.discNumber}-${t.trackNumber}`)
    .find((t, i, a) => a.indexOf(t) !== i);

  if (!duplicateTrackNumber) return null;

  return (
    <div className="m-2 rounded bg-red-500 p-2 text-white">
      Album contains duplicate track numbers—misnumbered CDs?
    </div>
  );
}
