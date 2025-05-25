import fsp from "node:fs/promises";
import path from "node:path";
import { lazy, Suspense } from "react";
import { Await, Link } from "react-router";
import { Breadcrumb, type BreadcrumbHandle } from "~/components/Breadcrumb";
import { BreadcrumbMenu } from "~/components/BreadcrumbMenu";
import { DirectorySkeleton } from "~/components/browse/DirectorySkeleton";
import { makeAppTitle } from "~/lib/constants";
import { rebasePath, stripLibraryPath } from "~/lib/paths";
import { isSupportedMusicFile } from "~/lib/tags/musicMetadata";
import type { Route } from "./+types/browse";
import { prefetch } from "~/lib/prefetch";
import { ClientOnly } from "remix-utils/client-only";
import { PathJump } from "~/components/browse/PathJump";
import { Button } from "~/components/ui/button";

const DirectoryList = lazy(() => import("~/components/browse/DirectoryList"));

export async function loader({ params }: Route.LoaderArgs) {
  const safePath = rebasePath(params["*"] || "");
  const strippedPath = stripLibraryPath(safePath);

  // Read the files and directories inside this directory (non-recursively)
  const entries = fsp
    .readdir(safePath, { withFileTypes: true })
    .then(async (dirents) => {
      // Stat all files in parallel for mtime
      const stats = await Promise.all(
        dirents.map(async (e) => {
          try {
            const stat = await fsp.stat(path.join(safePath, e.name));
            return stat.mtime.toISOString();
          } catch {
            return null;
          }
        }),
      );

      return dirents.map((e, i) => ({
        name: e.name,
        isDirectory: e.isDirectory(),
        isSupportedMusicFile: isSupportedMusicFile(e.name),
        mtime: stats[i],
      }));
    })
    .catch();

  // Generate breadcrumbs for the current path
  const breadcrumbs: { url: string; name: string }[] = strippedPath
    .split("/")
    .map((el, i, arr) => ({
      url: `/browse/${arr
        .slice(0, i + 1)
        .map(encodeURIComponent)
        .join("/")}`,
      name: el,
    }))
    .filter((bc) => bc.name !== "");

  return {
    path: strippedPath,
    pathBasename: path.basename(strippedPath),
    entries,
    breadcrumbs,
  };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: makeAppTitle(data.pathBasename || "Browse") }];
}

export const unstable_middleware: Route.unstable_MiddlewareFunction[] = [
  async ({ context, params }) => {
    const { queryClient, trpc } = prefetch(context);

    const safePath = rebasePath(params["*"] || "");
    const strippedPath = stripLibraryPath(safePath);

    // Prefetch the album pre-check, but without blocking the page. Don't bother pre-checking the library root
    if (strippedPath) {
      queryClient.prefetchQuery(
        trpc.browse.albumPrecheck.queryOptions({
          path: strippedPath,
        }),
      );
    }
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

export default function Browse({
  loaderData: { entries, path },
}: Route.ComponentProps) {
  return (
    <main className="mx-auto flex h-screen w-full max-w-6xl flex-col p-2">
      <div className="mb-2 flex items-center gap-2">
        <BreadcrumbMenu outerClassName="flex flex-1" />
        <div className="max-w-[300px] flex-1">
          <PathJump />
        </div>
        <Link to="/discographies">
          <Button variant="outline">Discographies</Button>
        </Link>
      </div>

      <ClientOnly fallback={<DirectorySkeleton />}>
        {() => (
          <Suspense fallback={<DirectorySkeleton />}>
            <Await resolve={entries}>
              {(entries) => <DirectoryList entries={entries} basePath={path} />}
            </Await>
          </Suspense>
        )}
      </ClientOnly>
    </main>
  );
}
