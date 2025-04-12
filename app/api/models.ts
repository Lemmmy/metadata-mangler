import { publicProcedure, router } from "~/api/trpc";
import { env } from "~/lib/env";
import { getWebSupportedModels } from "~/lib/aiProviders";

export const models = router({
  supportedModels: publicProcedure.query(() => ({
    defaultModel: env.DEFAULT_WEB_MODEL,
    supportedModels: getWebSupportedModels(),
  })),
});
