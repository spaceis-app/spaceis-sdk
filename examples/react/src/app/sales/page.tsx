import type { Metadata } from "next";
import {
  prefetchSales,
  dehydrate,
  QueryClient,
  HydrationBoundary,
} from "@spaceis/react/server";
import { getServerClient } from "@/lib/server";
import { SalesPage } from "@/views/SalesPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sales",
  description: "Active sales and promotions.",
};

export default async function Page() {
  const client = getServerClient();
  const qc = new QueryClient();

  await prefetchSales(qc, client, { sort: "expires_at" });

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <SalesPage />
    </HydrationBoundary>
  );
}
