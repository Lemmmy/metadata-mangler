import { useQuery } from "@tanstack/react-query";
import { getPreferredVgmdbName } from "~/lib/fetch/vgmdbUtils";
import { useTRPC } from "~/lib/trpc";
import { pluralN } from "~/lib/utils";

export function VgmdbHoverCardContents({ albumId }: { albumId: number }) {
  const trpc = useTRPC();
  const { error, isLoading, data } = useQuery(
    trpc.search.vgmdbDetails.queryOptions({ albumId }),
  );

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (isLoading || !data) {
    return <div>Loading...</div>;
  }

  const dedupedNames = Array.from(
    new Set(
      [data.name, data.names["en"], data.names["ja"], data.names["ja-latn"]]
        .filter((n) => n !== data.name)
        .filter(Boolean),
    ),
  );

  return (
    <div className="flex gap-4">
      {/* Cover art (if available) */}
      {data.covers[0]?.thumb && (
        <img
          src={data.covers[0].thumb}
          alt={data.name}
          className="h-24 w-24 rounded"
        />
      )}

      <div className="flex flex-col gap-1 text-sm">
        {/* Album names */}
        <div className="font-bold">{data.name}</div>
        {dedupedNames.map((name) => (
          <div key={name} className="opacity-75">
            {name}
          </div>
        ))}

        {/* Catalog number and release date */}
        <div className="text-muted-foreground text-xs">
          {data.catalog} - {data.release_date}
        </div>

        {/* Media format, publish format (category) and classification */}
        <div className="text-muted-foreground text-xs">
          {data.media_format}, {data.publish_format}, {data.classification}
        </div>

        {/* Publisher */}
        <div className="text-muted-foreground text-xs">
          {getPreferredVgmdbName(data.publisher.names)}
        </div>

        {/* Disc count & track count */}
        <div className="text-muted-foreground text-xs">
          {pluralN(data.discs.length, "disc")},{" "}
          {pluralN(
            data.discs.reduce((acc, disc) => acc + disc.tracks.length, 0),
            "track",
          )}
        </div>
      </div>
    </div>
  );
}
