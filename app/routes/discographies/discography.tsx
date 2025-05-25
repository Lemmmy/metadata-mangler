import { useMutation } from "@tanstack/react-query";
import { ObjectId } from "mongodb";
import { useState } from "react";
import { Link, useRevalidator } from "react-router";
import { ClientOnly } from "remix-utils/client-only";
import { toast } from "sonner";
import type {
  WebDiscography,
  WebDiscographyRelease,
  WebDiscographySource,
} from "~/api/discography";
import { Breadcrumb, type BreadcrumbHandle } from "~/components/Breadcrumb";
import { DiscographyContextProvider } from "~/components/discography/DiscographyContext";
import { DiscographyEditDialog } from "~/components/discography/DiscographyEditDialog";
import { DiscographyHeader } from "~/components/discography/DiscographyHeader";
import { DiscographyReleasesTable } from "~/components/discography/DiscographyReleasesTable";
import { useDiscographyTableColumns } from "~/components/discography/useDiscographyTableColumns";
import { Button } from "~/components/ui/button";
import { makeAppTitle } from "~/lib/constants";
import {
  getCollections,
  type DbDiscography,
  type DbDiscographyRelease,
  type DbDiscographySource,
} from "~/lib/db";
import { convertMusicBrainzArtistIdToUrl } from "~/lib/fetch/musicbrainzUtils";
import { convertVgmdbArtistIdToUrl } from "~/lib/fetch/vgmdbUtils";
import { useTRPC } from "~/lib/trpc";
import { pluralN } from "~/lib/utils";
import { type Route } from "./+types/discography";

export async function loader({ params }: Route.LoaderArgs) {
  const discographyId = params.id;
  const collections = await getCollections();
  if (!collections) return null;

  const discographies = await collections.discographies
    .aggregate([
      { $match: { _id: new ObjectId(discographyId) } },
      // Join sources and releases
      {
        $lookup: {
          from: "discographySources",
          localField: "_id",
          foreignField: "discographyId",
          as: "sources",
        },
      },
      {
        $lookup: {
          from: "discographyReleases",
          localField: "_id",
          foreignField: "discographyId",
          as: "releases",
        },
      },
      { $limit: 1 },
    ])
    .toArray();

  if (!discographies.length) return null;

  return {
    discography: {
      ...(discographies[0] as DbDiscography),

      _id: discographies[0]._id.toString() as string,

      sources: discographies[0].sources.map((s: DbDiscographySource) => ({
        ...s,
        discographyId: s.discographyId.toString() as string,
      })) as WebDiscographySource[],

      releases: discographies[0].releases.map((r: DbDiscographyRelease) => ({
        ...r,
        _id: r._id.toString() as string,
        discographyId: r.discographyId.toString() as string,
      })) as WebDiscographyRelease[],
    } satisfies WebDiscography,
  };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: makeAppTitle(`Discography: ${data?.discography?.name}`) }];
}

// prettier-ignore
export const handle: BreadcrumbHandle<Route.ComponentProps["loaderData"]> = {
  breadcrumb: (data) => data ? [
    // The root of the music library
    <Breadcrumb to="/discographies" key="root">Discographies</Breadcrumb>,
    // The current directory
    ...(data.discography._id ? [
      <Breadcrumb to={`/discographies/${data.discography._id}`} key="discography">{data.discography.name}</Breadcrumb>,
    ] : []),
  ] : [],
};

const emptyReleases: WebDiscographyRelease[] = [];

export default function DiscographyDetail({
  loaderData,
}: Route.ComponentProps) {
  const discography = loaderData?.discography;
  const trpc = useTRPC();
  const revalidator = useRevalidator();

  const { columnVisibility, setColumnVisibility } = useDiscographyTableColumns(
    discography?.releases ?? emptyReleases,
  );

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { mutateAsync: editMutate, isPending: isEditSubmitting } = useMutation(
    trpc.discography.update.mutationOptions(),
  );
  const handleEditDiscography = async (name: string, sourceUrls: string[]) => {
    if (!name.trim() || !discography) return;

    try {
      await editMutate({
        id: discography._id,
        name,
        sourceUrls,
      });

      setIsEditDialogOpen(false);
      revalidator.revalidate();
    } catch (error) {
      console.error("Failed to update discography:", error);
      toast.error("Failed to update discography");
    }
  };

  const { mutateAsync: refetchMutate, isPending: isRefetchPending } =
    useMutation(trpc.discography.refetchDiscography.mutationOptions());
  const handleRefetch = async () => {
    if (!discography) return;

    try {
      const res = await refetchMutate({ id: discography._id });

      if (res.errors?.length > 0) {
        toast.error(
          `${pluralN(res.errors.length, "error")} refetching discography`,
        );
      }

      if (res.added > 0) {
        toast.success(`${pluralN(res.added, "release")} added to discography`);
      } else {
        toast.info("No new releases found");
      }

      revalidator.revalidate();
    } catch (error) {
      console.error("Failed to refetch discography:", error);
      toast.error("Failed to refetch discography");
    }
  };

  if (!discography) {
    return (
      <div className="container py-8 text-center">
        <h1 className="mb-4 text-2xl font-bold">Discography not found</h1>
        <Link to="/discographies">
          <Button>Back to Discographies</Button>
        </Link>
      </div>
    );
  }

  return (
    <main className="text-foreground mx-auto box-border flex h-screen flex-col">
      <ClientOnly>
        {() => (
          <>
            <DiscographyContextProvider
              discographyId={discography._id}
              onDataChange={revalidator.revalidate}
            >
              <DiscographyHeader
                edit={() => setIsEditDialogOpen(true)}
                refetch={handleRefetch}
                refetchPending={isRefetchPending}
                columnVisibility={columnVisibility}
                setColumnVisibility={setColumnVisibility}
              />

              {/* Releases Table */}
              <DiscographyReleasesTable
                releases={discography.releases}
                columnVisibility={columnVisibility}
                setColumnVisibility={setColumnVisibility}
              />
            </DiscographyContextProvider>
          </>
        )}
      </ClientOnly>

      {/* Edit Dialog */}
      <DiscographyEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleEditDiscography}
        isSubmitting={isEditSubmitting}
        create={false}
        name={discography.name}
        sourceUrls={discography.sources.flatMap((source) =>
          [
            source.vgmdbArtistId
              ? convertVgmdbArtistIdToUrl(source.vgmdbArtistId)
              : "",
            source.musicBrainzArtistId
              ? convertMusicBrainzArtistIdToUrl(source.musicBrainzArtistId)
              : "",
          ].filter(Boolean),
        )}
      />
    </main>
  );
}
