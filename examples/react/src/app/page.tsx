import { Suspense } from "react";
import type { Metadata } from "next";
import {
  prefetchProducts,
  prefetchCategories,
  dehydrate,
  QueryClient,
  HydrationBoundary,
} from "@spaceis/react/server";
import { getServerClient } from "@/lib/server";
import { ProductsPage } from "@/views/ProductsPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse products in our store.",
};

export default async function Page() {
  const client = getServerClient();
  const qc = new QueryClient();

  await Promise.all([
    prefetchProducts(qc, client, { page: 1 }),
    prefetchCategories(qc, client),
  ]);

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <Suspense>
        <ProductsPage />
      </Suspense>
    </HydrationBoundary>
  );
}
