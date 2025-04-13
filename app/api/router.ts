import { album } from "./album";
import { browse } from "./browse";
import { metadata } from "./metadata";
import { models } from "./models";
import { router } from "./trpc";

export const appRouter = router({
  models,
  album,
  browse,
  metadata,
});

export type AppRouter = typeof appRouter;
