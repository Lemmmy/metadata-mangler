import type { ReactElement } from "react";
import { useMetadataStore } from "./useMetadataStore";
import { useShallow } from "zustand/react/shallow";

export function AlbumCodecs(): ReactElement {
  const { tracks } = useMetadataStore(
    useShallow((s) => ({
      tracks: s.tracks,
    })),
  );

  const containers = Array.from(new Set(tracks.map((t) => t.container))).join(
    ", ",
  );
  const codecs = Array.from(new Set(tracks.map((t) => t.codec))).join(", ");
  const tagTypes = Array.from(new Set(tracks.flatMap((t) => t.tagTypes))).join(
    ", ",
  );

  return (
    <span className="text-muted-foreground text-sm">
      <span className="text-orange-500" title="Containers">
        {containers}
      </span>
      {", "}
      <span className="text-green-500" title="Codecs">
        {codecs}
      </span>
      {", "}
      <span className="text-blue-500" title="Tag types">
        {tagTypes}
      </span>
    </span>
  );
}
