import { redirect } from "react-router";
import type { Route } from "./+types/home";
import { appName } from "~/lib/constants";

export function loader() {
  return redirect("/browse");
}

export function meta({}: Route.MetaArgs) {
  return [{ title: appName }];
}
