"use client";

import { useQuery } from "@tanstack/react-query";
import { useSpaceIS } from "../provider";
import type { GetPagesParams } from "@spaceis/sdk";

/**
 * Fetch a list of CMS pages.
 *
 * @example
 * ```tsx
 * function FooterLinks() {
 *   const { data: pages = [] } = usePages();
 *   return <>{pages.map(p => <a key={p.uuid} href={`/page/${p.slug}`}>{p.title}</a>)}</>;
 * }
 * ```
 */
export function usePages(params?: GetPagesParams) {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: ["spaceis", "pages", params] as const,
    queryFn: () => client.content.pages(params),
    staleTime: 5 * 60_000,
  });
}

/**
 * Fetch a single CMS page by slug.
 * The query is disabled when `slug` is `null`.
 *
 * @example
 * ```tsx
 * function CmsPage({ slug }: { slug: string }) {
 *   const { data: page, isLoading } = usePage(slug);
 *   if (isLoading) return <Spinner />;
 *   return <article dangerouslySetInnerHTML={{ __html: page?.content ?? '' }} />;
 * }
 * ```
 */
export function usePage(slug: string | null) {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: ["spaceis", "page", slug] as const,
    queryFn: () => client.content.page(slug!),
    enabled: slug !== null && slug.length > 0,
  });
}

/**
 * Fetch the shop's legal statute.
 * Uses a longer stale time (10 min) since statute rarely changes.
 *
 * @example
 * ```tsx
 * function StatutePage() {
 *   const { data: statute } = useStatute();
 *   return <article dangerouslySetInnerHTML={{ __html: statute?.content ?? '' }} />;
 * }
 * ```
 */
export function useStatute() {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: ["spaceis", "statute"] as const,
    queryFn: () => client.content.statute(),
    staleTime: 10 * 60_000,
  });
}
