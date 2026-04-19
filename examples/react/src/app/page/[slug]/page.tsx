import {
  prefetchPage,
  dehydrate,
  QueryClient,
  HydrationBoundary,
} from "@spaceis/react/server";
import { getServerClient } from "@/lib/server";
import { SinglePageContent } from "@/features/content/ContentPage";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const client = getServerClient();
  const qc = new QueryClient();

  await prefetchPage(qc, client, slug);

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <SinglePageContent slug={slug} />
    </HydrationBoundary>
  );
}
