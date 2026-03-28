"use client";

import { useQuery } from "@tanstack/react-query";
import { useSpaceIS } from "../provider";

/**
 * Fetch the shop's template configuration (colors, layout, section settings, etc.).
 * Uses a longer stale time (10 min) since shop config rarely changes.
 *
 * @example
 * ```tsx
 * function ThemedLayout({ children }: { children: React.ReactNode }) {
 *   const { data: config } = useShopConfig();
 *   return (
 *     <div style={{ '--accent': config?.meta.accent_color }}>
 *       {children}
 *     </div>
 *   );
 * }
 * ```
 */
export function useShopConfig() {
  const { client } = useSpaceIS();

  return useQuery({
    queryKey: ["spaceis", "shop-config"] as const,
    queryFn: () => client.shop.config(),
    staleTime: 10 * 60_000,
  });
}
