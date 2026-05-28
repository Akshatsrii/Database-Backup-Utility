"use client";

import { QueryClient, QueryClientProvider, onlineManager } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [qc] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime:            10_000,   // data fresh for 10s
            gcTime:               5 * 60_000, // keep unused cache 5 min
            retry:                1,
            retryDelay:           (n) => Math.min(1_000 * 2 ** n, 15_000), // exp back-off, cap 15s
            refetchOnWindowFocus: true,
            refetchOnReconnect:   true,     // re-fetch when network comes back
            networkMode:          "offlineFirst", // don't block queries while offline
          },
          mutations: {
            retry:      0,                  // mutations shouldn't auto-retry
            networkMode: "always",
            onError: (err) => {
              // global mutation error hook — override per-mutation as needed
              console.error("[mutation error]", err);
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={qc}>
      {children}
    </QueryClientProvider>
  );
}