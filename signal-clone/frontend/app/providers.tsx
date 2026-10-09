"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#2A2A2A",
            color: "#fff",
            border: "1px solid #3D3D3D",
            borderRadius: "12px",
            fontSize: "14px",
          },
          success: { iconTheme: { primary: "#4CD964", secondary: "#fff" } },
          error: { iconTheme: { primary: "#FF453A", secondary: "#fff" } },
        }}
      />
    </QueryClientProvider>
  );
}
