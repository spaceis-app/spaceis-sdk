import type { Metadata } from "next";
import {
  prefetchProduct,
  prefetchProductRecommendations,
  dehydrate,
  QueryClient,
  HydrationBoundary,
} from "@spaceis/react/server";
import { getServerClient } from "@/lib/server";
import { ProductPage } from "@/views/ProductPage";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const client = getServerClient();
    const product = await client.products.get(slug);

    const description = product.description
      ? product.description.replace(/<[^>]*>/g, "").slice(0, 160)
      : `Buy ${product.name} on our Minecraft store.`;

    return {
      title: product.name,
      description,
      openGraph: {
        title: product.name,
        description,
        images: product.image ? [product.image] : undefined,
        type: "website",
      },
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const client = getServerClient();
  const qc = new QueryClient();

  await Promise.all([
    prefetchProduct(qc, client, slug),
    prefetchProductRecommendations(qc, client, slug),
  ]);

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <ProductPage slug={slug} />
    </HydrationBoundary>
  );
}
