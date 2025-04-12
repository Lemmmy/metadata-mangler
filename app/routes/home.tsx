import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { AlbumInformationSection } from "~/components/AlbumInformationSection";
import { AlbumLookupSection } from "~/components/AlbumLookupSection";
import { AlbumTracksTable } from "~/components/AlbumTracksTable";
import { Button } from "~/components/ui/button";
import { useAlbumTableColumns } from "~/components/useAlbumTableColumns";
import { useMetadataStore } from "~/components/useMetadataStore";
import { env } from "~/lib/env";
import { prefetch } from "~/lib/prefetch";
import { useTRPC } from "~/lib/trpc";
import type { Route } from "./+types/home";
import { useLoaderData } from "react-router";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.svg" },
];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Metadata Mangler" },
    {
      name: "description",
      content: "AI-powered metadata editing tool for music albums",
    },
  ];
}

export function loader() {
  return {
    testDataPath: env.TEST_ALBUM_PATH,
  };
}

export const unstable_middleware: Route.unstable_MiddlewareFunction[] = [
  async ({ context }) => {
    const { queryClient, trpc } = prefetch(context);

    await queryClient.prefetchQuery(trpc.models.supportedModels.queryOptions());
  },
];

export default function Home() {
  const { testDataPath } = useLoaderData<typeof loader>();

  // Get state and actions from the metadata store
  const { album, tracks, initialize, hasUnsavedChanges } = useMetadataStore(
    useShallow((s) => ({
      album: s.album,
      tracks: s.tracks,
      originalTracks: s.originalTracks,
      updatedFields: s.updatedFields,
      initialize: s.initialize,
      updateTrack: s.updateTrack,
      hasUnsavedChanges: Object.values(s.updatedFields).some(
        (set) => set.size > 0,
      ),
    })),
  );

  const trpc = useTRPC();
  const albumData = useQuery(
    trpc.album.getFromDirectory.queryOptions({
      path: testDataPath,
    }),
  );

  const isLoading = albumData.isLoading;
  const error = albumData.error ? albumData.error.message : null;
  const albumDataTracks = albumData.data?.tracks || [];

  // Initialize the store with album data when it's loaded
  useEffect(() => {
    if (albumData.data?.album && albumData.data?.tracks) {
      initialize(albumData.data.album, albumData.data.tracks, true);
    }
  }, [albumData.data, initialize]);

  const originalTracks = useMetadataStore(useShallow((s) => s.originalTracks));
  const { columnVisibility, setColumnVisibility } =
    useAlbumTableColumns(originalTracks);

  const handleSaveChanges = () => {
    // In a real implementation, you would call a mutation to save the changes
    // const updatedTracks = getTrackData();
    // trpc.album.updateTracks.mutate({ tracks: updatedTracks });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Use albumData.data?.tracks as fallback if store tracks are empty
  const displayTracks = tracks.length > 0 ? tracks : albumDataTracks;

  return (
    <main className="text-foreground mx-auto box-border min-h-screen p-4">
      {isLoading && (
        <div className="bg-muted mb-4 rounded-md p-4 text-center">
          <p>Loading album metadata...</p>
        </div>
      )}
      {error && (
        <div className="bg-destructive text-destructive-foreground mb-4 rounded-md p-4">
          <p>Error: {error}</p>
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr]">
        <div className="flex-shrink-0">
          {album?.coverArt ? (
            <img
              src={album.coverArt}
              alt="Album Cover"
              className="h-48 w-48 rounded-lg object-cover shadow-md"
            />
          ) : (
            <div className="bg-muted flex h-48 w-48 items-center justify-center rounded-lg">
              <span className="text-muted-foreground text-sm">
                No cover art
              </span>
            </div>
          )}
        </div>

        <div>
          <AlbumInformationSection album={album} />
          <AlbumLookupSection
            album={album}
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

      {hasUnsavedChanges && (
        <div className="mt-4">
          <p className="text-muted-foreground">Changes not saved</p>
          <Button variant="default" size="sm" onClick={handleSaveChanges}>
            Save Changes
          </Button>
        </div>
      )}
    </main>
  );
}
