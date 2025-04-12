import { redirect } from "react-router";
import type { Route } from "./+types/home";

export function loader() {
  return redirect("/browse");
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Metadata Mangler" },
    {
      name: "description",
      content: "AI-powered metadata editing tool for music albums",
    },
  ];
}
