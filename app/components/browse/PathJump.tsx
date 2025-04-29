import { FolderInput } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useTRPC, useTRPCClient } from "~/lib/trpc";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

export function PathJump() {
  const [value, setValue] = useState("");
  const navigate = useNavigate();
  const trpc = useTRPC();
  const client = useTRPCClient();

  const pathJumpQuery = useQuery({
    ...trpc.browse.pathJump.queryOptions({
      path: value,
    }),
    enabled: false,
  });

  async function go() {
    if (!value) return;

    try {
      // First normalize the path
      const pathResult = await pathJumpQuery.refetch();
      const pathData = pathResult.data;
      if (!pathData?.success || !("path" in pathData)) {
        toast.error(
          pathData && "error" in pathData
            ? pathData.error
            : "Failed to process path",
        );
        return;
      }

      // Then check if it's a valid album
      const checkResult = await client.browse.albumPrecheck.query({
        path: pathData.path,
      });
      if (!checkResult?.success) {
        if (checkResult && "error" in checkResult) {
          toast.error(checkResult.error);
        } else {
          toast.error("Too many tracks in this directory");
        }
        return;
      }

      const path = "path" in pathData ? pathData.path : undefined;
      if (!path) {
        toast.error("Failed to process path");
        return;
      }

      // If all checks pass, navigate to the album
      navigate(`/album/${encodeURIComponent(path)}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to jump to path",
      );
    }
  }

  return (
    <div className="flex items-center">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && go()}
        placeholder="Jump to path..."
        className="flex-1 rounded-r-none"
      />
      <Button
        size="icon"
        variant="outline"
        onClick={() => go()}
        className="rounded-l-none border-l-0"
        disabled={!value || pathJumpQuery.isFetching}
      >
        <FolderInput />
      </Button>
    </div>
  );
}
