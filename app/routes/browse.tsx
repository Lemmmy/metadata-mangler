import fsp from "node:fs/promises";
import path from "node:path";
import { rebasePath } from "~/lib/paths";
import { isSupportedMusicFile } from "~/lib/tags/musicMetadata";
import type { Route } from "./+types/browse";
import { DirectoryList } from "~/components/browse/DirectoryList";
import { Suspense } from "react";
import { Await } from "react-router";

export function loader({ params }: Route.LoaderArgs) {
  const safePath = rebasePath(params["*"] || "");

  // Read the files and directories inside this directory (non-recursively)
  const entries = fsp.readdir(safePath, { withFileTypes: true }).then((e) =>
    e.map((e) => ({
      name: e.name,
      isDirectory: e.isDirectory(),
      isSupportedMusicFile: isSupportedMusicFile(e.name),
    })),
  );

  return {
    path: safePath,
    pathBasename: path.basename(safePath),
    entries,
  };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.pathBasename }];
}

export default function Browse({
  loaderData: { entries },
}: Route.ComponentProps) {
  return (
    <div>
      <Suspense fallback={<div>TODO: Loader</div>}>
        <Await resolve={entries}>
          {(entries) => <DirectoryList entries={entries} />}
        </Await>
      </Suspense>
    </div>
  );
}
