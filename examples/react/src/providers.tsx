"use client";

import { SpaceISProvider } from "@spaceis/react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SpaceISProvider
      config={{
        baseUrl:
          process.env.NEXT_PUBLIC_SPACEIS_API_URL ||
          "https://storefront-api.spaceis.app",
        shopUuid: process.env.NEXT_PUBLIC_SPACEIS_SHOP_UUID || "",
        lang: "pl",
      }}
      cartOptions={{ autoLoad: true }}
    >
      {children}
      <Toaster position="bottom-right" richColors />
    </SpaceISProvider>
  );
}
