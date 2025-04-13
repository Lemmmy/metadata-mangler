import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/browse/*", "routes/browse.tsx"),
  route("/album/*", "routes/album.tsx"),
  route("/api/trpc/*", "routes/trpc.ts"),
] satisfies RouteConfig;
