import { models } from "~/api/models";
import { album } from "~/api/album";
import { metadata } from "~/api/metadata";
import { router } from "~/api/trpc";

export const appRouter = router({
  models,
  album,
  metadata,
});

export type AppRouter = typeof appRouter;
