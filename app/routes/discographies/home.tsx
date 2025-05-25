import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";
import { DiscographyEditDialog } from "~/components/discography/DiscographyEditDialog";
import { Button } from "~/components/ui/button";
import { makeAppTitle } from "~/lib/constants";
import { prefetch } from "~/lib/prefetch";
import { useTRPC, useTRPCClient } from "~/lib/trpc";
import type { Route } from "./+types/home";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function meta() {
  return [{ title: makeAppTitle("Discographies") }];
}

export const unstable_middleware: Route.unstable_MiddlewareFunction[] = [
  async ({ context }) => {
    const { queryClient, trpc } = prefetch(context);
    await queryClient.prefetchQuery(trpc.discography.list.queryOptions());
  },
];

export default function Discographies() {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const {
    data: discographies,
    isLoading,
    refetch,
  } = useQuery(trpc.discography.list.queryOptions());

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateDiscography = async (
    name: string,
    sourceUrls: string[],
  ) => {
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await trpcClient.discography.create.mutate({
        name,
        sourceUrls,
      });

      setIsCreateDialogOpen(false);
      refetch();
    } catch (error) {
      console.error("Failed to create discography:", error);
      toast.error("Failed to create discography");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex h-screen w-full max-w-6xl flex-col p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Discographies</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus />
          Add discography
        </Button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center">Loading discographies...</div>
      ) : discographies?.length === 0 ? (
        <div className="text-muted-foreground py-8 text-center">
          No discographies found. Add one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {discographies?.map((discography) => (
            <Link
              key={discography._id.toString()}
              to={`/discographies/${discography._id}`}
              className="block"
            >
              <div className="hover:bg-muted rounded-lg border p-4 transition-colors">
                <h2 className="text-xl font-semibold">{discography.name}</h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  {discography.sources?.length || 0} source
                  {discography.sources?.length !== 1 ? "s" : ""}
                  {" • "}
                  {discography.releases?.length || 0} release
                  {discography.releases?.length !== 1 ? "s" : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Discography Dialog */}
      <DiscographyEditDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateDiscography}
        isSubmitting={isSubmitting}
        create
        name=""
        sourceUrls={[]}
      />
    </main>
  );
}
