import type { ReactElement } from "react";
import { Button } from "../ui/button";
import { useMetadataStore } from "./useMetadataStore";
import { useShallow } from "zustand/react/shallow";
import { useTRPC } from "~/lib/trpc";
import { useMutation } from "@tanstack/react-query";

interface Props {
  path: string;
}

export function AlbumArt({ path }: Props): ReactElement {
  const { coverArt, urlOrData, setAlbumArt } = useMetadataStore(
    useShallow((s) => ({
      coverArt: s.album?.coverArt,
      urlOrData: s.urlOrData,
      setAlbumArt: s.setAlbumArt,
    })),
  );

  const trpc = useTRPC();
  const { isPending, mutate } = useMutation(
    trpc.album.fetchCoverFromSource.mutationOptions({
      onSuccess: (data) => {
        if (data.success && "coverArt" in data) {
          setAlbumArt(data.coverArt);
        }
      },
    }),
  );

  if (coverArt) {
    return (
      <img
        src={coverArt}
        alt="Album Cover"
        className="h-48 w-48 rounded-lg object-cover shadow-md"
      />
    );
  } else {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="bg-muted flex h-48 w-48 items-center justify-center rounded-lg">
          <span className="text-muted-foreground text-sm">No cover art</span>
        </div>

        <Button
          size="sm"
          disabled={!urlOrData || isPending}
          onClick={() => mutate({ path, sourceUrl: urlOrData })}
        >
          Fetch from source
        </Button>
      </div>
    );
  }
}
