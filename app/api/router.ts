import { album } from "./album";
import { browse } from "./browse";
import { metadata } from "./metadata";
import { models } from "./models";
import { router } from "./trpc";
import { search } from "./search";
import { replacements } from "./replacements";

export const appRouter = router({
  album,
  browse,
  metadata,
  models,
  replacements,
  search,
});

export type AppRouter = typeof appRouter;
