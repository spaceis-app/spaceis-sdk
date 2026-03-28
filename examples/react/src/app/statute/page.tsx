import type { Metadata } from "next";
import {
  prefetchStatute,
  dehydrate,
  QueryClient,
  HydrationBoundary,
} from "@spaceis/react/server";
import { getServerClient } from "@/lib/server";
import { StatutePage } from "@/views/StatutePage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Shop terms and conditions.",
};

export default async function Page() {
  const client = getServerClient();
  const qc = new QueryClient();

  await prefetchStatute(qc, client);

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <StatutePage />
    </HydrationBoundary>
  );
}
