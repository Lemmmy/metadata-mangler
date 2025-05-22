import { QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { useState } from "react";
import { getQueryClient, TRPCProvider } from "~/lib/trpc";
import type { AppRouter } from "~/api/router";
import { SyncedBrowserProvider } from "./SyncedBrowser";
import { UnsavedChangesHandler } from "./UnsavedChangesHandler";

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        // If you want to use async generators and streaming, use httpBatchStreamLink instead
        httpBatchLink({
          url: "/api/trpc",
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <SyncedBrowserProvider>
          <UnsavedChangesHandler />
          {children}
        </SyncedBrowserProvider>
      </TRPCProvider>
    </QueryClientProvider>
  );
}
