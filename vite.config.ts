import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import babel from "vite-plugin-babel";
import devtoolsJson from "vite-plugin-devtools-json";

export default defineConfig({
  build: {
    rollupOptions: {
      external: ["kuroshiro", "kuroshiro-analyzer-kuromoji"],
      output: {
        globals: {
          kuroshiro: "Kuroshiro",
          "kuroshiro-analyzer-kuromoji": "KuromojiAnalyzer",
        },
      },
    },
  },
  plugins: [
    tailwindcss(),
    babel({
      filter: /\.[jt]sx?$/,
      loader: "jsx",
      babelConfig: {
        compact: false,
        presets: ["@babel/preset-typescript"],
        plugins: [["babel-plugin-react-compiler", { target: "19" }]],
      },
    }),
    reactRouter(),
    tsconfigPaths(),
    devtoolsJson(),
  ],
});
