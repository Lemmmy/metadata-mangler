import { useQuery } from "@tanstack/react-query";
import { getPreferredVgmdbName } from "~/lib/fetch/vgmdbUtils";
import { useTRPC } from "~/lib/trpc";
import { plural, pluralN } from "~/lib/utils";

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
      {/* Left column */}
      <div className="flex w-24 flex-shrink-0 flex-col gap-1 text-center text-sm">
        {/* Cover art (if available) */}
        {data.covers[0]?.thumb && (
          <img
            src={data.covers[0].thumb}
            alt={data.name}
            className="mb-2 h-24 w-24 rounded"
          />
        )}

        {/* Catalog number */}
        <div className="text-xs">{data.catalog}</div>

        {/* Release date */}
        <div className="text-xs">{data.release_date}</div>

        {/* Media format */}
        <div className="text-muted-foreground text-xs">
          <b>Format:</b> {data.media_format}
        </div>

        {/* Disc count & track count */}
        <div className="text-muted-foreground text-xs">
          <span className="whitespace-nowrap">
            {pluralN(data.discs.length, "disc")},
          </span>{" "}
          <span className="whitespace-nowrap">
            {pluralN(
              data.discs.reduce((acc, disc) => acc + disc.tracks.length, 0),
              "track",
            )}
          </span>
        </div>
      </div>

      {/* Right column */}
      <div className="flex flex-col gap-1 text-sm">
        {/* Album names */}
        <div className="font-bold">{data.name}</div>
        {dedupedNames.map((name) => (
          <div key={name} className="opacity-75">
            {name}
          </div>
        ))}

        {/* Publish format (category) and classification */}
        <div className="text-muted-foreground text-xs">
          <span className="whitespace-nowrap">{data.publish_format}</span>
          {", "}
          <span className="whitespace-nowrap">{data.classification}</span>
        </div>

        {/* Publisher */}
        {data.publisher?.names && (
          <div className="text-muted-foreground text-xs">
            <b>Publisher:</b> {getPreferredVgmdbName(data.publisher.names)}
          </div>
        )}

        {/* Composer & arranger list */}
        {data.composers?.length > 0 && (
          <div className="text-muted-foreground text-xs">
            <b>{plural(data.composers.length, "Composer")}:</b>{" "}
            {data.composers
              .map((composer) => getPreferredVgmdbName(composer.names))
              .join(", ")}
          </div>
        )}

        {/* Arranger list */}
        {data.arrangers?.length > 0 && (
          <div className="text-muted-foreground text-xs">
            <b>{plural(data.arrangers.length, "Arranger")}:</b>{" "}
            {data.arrangers
              .map((arranger) => getPreferredVgmdbName(arranger.names))
              .join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}
