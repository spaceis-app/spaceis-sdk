import type { MetadataRoute } from "next";
import { getServerClient } from "@/lib/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/packages`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/sales`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/voucher`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/daily-reward`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/statute`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/page`, changeFrequency: "weekly", priority: 0.4 },
  ];

  try {
    const client = getServerClient();

    const [productsResult, pages] = await Promise.all([
      client.products.list({ per_page: 100 }),
      client.content.pages(),
    ]);

    const productRoutes: MetadataRoute.Sitemap = productsResult.data.map((p) => ({
      url: `${baseUrl}/product/${p.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

    const pageRoutes: MetadataRoute.Sitemap = pages.map((p) => ({
      url: `${baseUrl}/page/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    }));

    return [...staticRoutes, ...productRoutes, ...pageRoutes];
  } catch {
    return staticRoutes;
  }
}
