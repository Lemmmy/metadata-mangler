import { album } from "./album";
import { browse } from "./browse";
import { metadata } from "./metadata";
import { models } from "./models";
import { router } from "./trpc";
import { search } from "./search";

export const appRouter = router({
  models,
  album,
  browse,
  metadata,
  search,
});

export type AppRouter = typeof appRouter;
