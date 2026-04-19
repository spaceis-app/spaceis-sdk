import type { Metadata } from "next";
import {
  prefetchPackages,
  prefetchCategories,
  dehydrate,
  QueryClient,
  HydrationBoundary,
} from "@spaceis/react/server";
import { getServerClient } from "@/lib/server";
import { PackagesPage } from "@/features/packages/PackagesPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Packages",
  description: "Bundle deals in our store.",
};

export default async function Page() {
  const client = getServerClient();
  const qc = new QueryClient();

  await Promise.all([
    prefetchPackages(qc, client, { page: 1 }),
    prefetchCategories(qc, client),
  ]);

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <PackagesPage />
    </HydrationBoundary>
  );
}
