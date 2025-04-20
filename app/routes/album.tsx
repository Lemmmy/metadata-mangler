import { useQuery } from "@tanstack/react-query";
import path from "node:path";
import { pathExists } from "path-exists";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { AlbumHeader } from "~/components/album/AlbumHeader";
import { AlbumInformationSection } from "~/components/album/AlbumInformationSection";
import { AlbumLookupSection } from "~/components/album/AlbumLookupSection";
import { AlbumTracksTable } from "~/components/album/table/AlbumTracksTable";
import { useAlbumTableColumns } from "~/components/album/table/useAlbumTableColumns";
import { useMetadataStore } from "~/components/album/useMetadataStore";
import { makeAppTitle } from "~/lib/constants";
import { make404 } from "~/lib/errors";
import { rebasePath, stripLibraryPath } from "~/lib/paths";
import { prefetch } from "~/lib/prefetch";
import { useTRPC } from "~/lib/trpc";
import type { Route } from "./+types/album";
import { Breadcrumb, type BreadcrumbHandle } from "~/components/Breadcrumb";
import { AlbumArt } from "~/components/album/AlbumArt";

export async function loader({ params }: Route.LoaderArgs) {
  const safePath = rebasePath(params["*"] || "");
  const strippedPath = stripLibraryPath(safePath);

  if (!strippedPath || !(await pathExists(safePath))) {
    throw make404("Invalid path or not found");
  }

  // Generate breadcrumbs for the current path
  const breadcrumbs: { url: string; name: string }[] = strippedPath
    .split("/")
    .map((el, i, arr) => ({
      url:
        i === arr.length - 1
          ? `/album/${arr
              .slice(0, i + 1)
              .map(encodeURIComponent)
              .join("/")}`
          : `/browse/${arr
              .slice(0, i + 1)
              .map(encodeURIComponent)
              .join("/")}`,
      name: el,
    }))
    .filter((bc) => bc.name !== "");

  return {
    path: strippedPath,
    pathBasename: path.basename(strippedPath),
    breadcrumbs,
  };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: makeAppTitle(data?.pathBasename || "Album") }];
}

export const unstable_middleware: Route.unstable_MiddlewareFunction[] = [
  async ({ context }) => {
    const { queryClient, trpc } = prefetch(context);

    await queryClient.prefetchQuery(trpc.models.supportedModels.queryOptions());
  },
];

// prettier-ignore
export const handle: BreadcrumbHandle<Route.ComponentProps["loaderData"]> = {
  breadcrumb: (data) => data ? [
    // The root of the music library
    <Breadcrumb to="/browse" key="root">Browse</Breadcrumb>,
    // The current directory
    ...(data.breadcrumbs.map((bc, i) => <Breadcrumb to={bc.url} key={i}>{bc.name}</Breadcrumb>)),
  ] : [],
};

export default function Home({
  loaderData: { path, pathBasename },
}: Route.ComponentProps) {
  // Get state and actions from the metadata store
  const { album, tracks, initialize } = useMetadataStore(
    useShallow((s) => ({
      album: s.album,
      tracks: s.tracks,
      initialize: s.initialize,
    })),
  );

  const trpc = useTRPC();
  const { isLoading, error, data } = useQuery(
    trpc.album.getFromDirectory.queryOptions({
      path,
    }),
  );

  const albumDataTracks = data?.tracks || [];

  // Initialize the store with album data when it's loaded, and also set the document title
  useEffect(() => {
    if (data?.album && data?.tracks) {
      initialize(data.album, data.tracks, true);
      document.title = makeAppTitle(data.album.name);
    }
  }, [data, initialize]);

  const originalTracks = useMetadataStore(useShallow((s) => s.originalTracks));
  const { columnVisibility, setColumnVisibility } =
    useAlbumTableColumns(originalTracks);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  // Use albumData.data?.tracks as fallback if store tracks are empty
  const displayTracks = tracks.length > 0 ? tracks : albumDataTracks;

  return (
    <main className="text-foreground mx-auto box-border flex h-screen flex-col">
      <AlbumHeader album={album} />

      <div className="grid grid-cols-1 gap-6 p-4 md:grid-cols-[auto_1fr]">
        <div className="flex-shrink-0">
          <AlbumArt path={path} />
        </div>

        <div>
          <AlbumInformationSection />
          <AlbumLookupSection
            album={album}
            dirName={pathBasename}
            className="mt-4"
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
          />
        </div>
      </div>

      <AlbumTracksTable
        tracks={displayTracks}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
      />
    </main>
  );
}
