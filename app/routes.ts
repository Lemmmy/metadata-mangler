import {
  type RouteConfig,
  index,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/browse/*", "routes/browse.tsx"),
  route("/album/*", "routes/album.tsx"),
  route("/open/album/*", "routes/open/album.tsx"),
  ...prefix("/discographies", [
    index("routes/discographies/home.tsx"),
    route(":id", "routes/discographies/discography.tsx"),
  ]),
  route("/api/trpc/*", "routes/trpc.ts"),
  route("/api/dict/:dict", "routes/dict.ts"),
] satisfies RouteConfig;
