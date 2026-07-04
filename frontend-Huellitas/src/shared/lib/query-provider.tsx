"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Usamos useState para asegurarnos de que el QueryClient se cree UNA SOLA VEZ 
  // por cada usuario, y no se reinicie si Next.js decide re-renderizar la página.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // Los datos se consideran "frescos" por 1 minuto por defecto
            refetchOnWindowFocus: false, // Evita que recargue datos solo por cambiar de pestaña en Chrome
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}