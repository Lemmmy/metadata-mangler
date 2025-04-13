import "~/app.css";
import {
  data,
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";
import { Providers } from "~/components/providers";
import {
  queryClientContext,
  queryClientMiddleware,
  trpcMiddleware,
} from "~/lib/prefetch";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <script
          src="https://cdn.jsdelivr.net/npm/kuroshiro@1.2.0/dist/kuroshiro.min.js"
          integrity="sha256-4+YJNVRJsd209WJTQCqn/FRHQ98zRgKOVqEh8D0HF+Y="
          crossOrigin="anonymous"
        ></script>
        <script
          src="https://cdn.jsdelivr.net/npm/kuroshiro-analyzer-kuromoji@1.1.0/dist/kuroshiro-analyzer-kuromoji.min.js"
          integrity="sha256-v4lO37aQilWY5ufo/4xwxe+Vpj0SNcJSc2taqDjL/tE="
          crossOrigin="anonymous"
        ></script>
        <Scripts />
      </body>
    </html>
  );
}

export const unstable_middleware = [queryClientMiddleware, trpcMiddleware];
export const shouldRevalidate = () => false;

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.svg" },
];

export function loader({ context }: Route.LoaderArgs) {
  const queryClient = context.get(queryClientContext);

  return data(dehydrate(queryClient));
}

export default function App({ loaderData }: Route.ComponentProps) {
  return (
    <Providers>
      <HydrationBoundary state={loaderData}>
        <Outlet />
      </HydrationBoundary>
    </Providers>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
