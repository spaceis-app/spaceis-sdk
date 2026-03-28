import type { Metadata } from "next";
import {
  prefetchPages,
  dehydrate,
  QueryClient,
  HydrationBoundary,
} from "@spaceis/react/server";
import { getServerClient } from "@/lib/server";
import { PagesListPage } from "@/views/ContentPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pages",
  description: "Information pages.",
};

export default async function Page() {
  const client = getServerClient();
  const qc = new QueryClient();

  await prefetchPages(qc, client);

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <PagesListPage />
    </HydrationBoundary>
  );
}
