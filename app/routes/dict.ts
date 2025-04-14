import { redirect } from "react-router";
import type { Route } from "./+types/dict";

// Kuromoji tries to fetch `/cdn/jsdelivr.net` for some reason, so do our own dictionary redirecting
export async function loader({ params }: Route.LoaderArgs) {
  const dict = params.dict;
  if (!dict) throw new Response("Not Found", { status: 404 });

  const url = `https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/${dict}`;
  return redirect(url, 307); // 307 preserves method (GET/HEAD)
}
