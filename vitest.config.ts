import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [(tsconfigPaths as any)()],
  test: {
    server: {
      deps: {
        inline: ["@opentelemetry/api"],
      },
    },
  },
});
