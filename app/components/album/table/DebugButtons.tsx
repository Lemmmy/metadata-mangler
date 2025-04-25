import { useMutation } from "@tanstack/react-query";
import { Button } from "~/components/ui/button";
import { useTRPC } from "~/lib/trpc";
import type { StoreTrack } from "../useMetadataStore";
import { toast } from "sonner";

interface Props {
  track: StoreTrack;
}

export function DebugButtons({ track }: Props) {
  const trpc = useTRPC();
  const dump = useMutation(trpc.metadata.dump.mutationOptions());

  const handleDump = () => {
    dump
      .mutateAsync({
        filePath: track.directory + "/" + track.filename,
      })
      .then((res) => {
        console.log(res);
        toast.info("Tags dumped to console");
      });
  };

  return (
    <Button size="sm" variant="outline" onClick={handleDump}>
      Dump tags
    </Button>
  );
}
