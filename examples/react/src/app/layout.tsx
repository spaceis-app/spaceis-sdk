import type { Metadata } from "next";
import { Providers } from "@/providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ClientCartDrawer } from "@/features/cart/ClientCartDrawer";
import { getServerClient } from "@/lib/server";
import "@/styles.css";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const client = getServerClient();
    const config = await client.shop.config();

    const title = config.meta?.title || "SpaceIS Store";
    const description =
      config.meta?.description || "Shop powered by SpaceIS SDK";

    return {
      title: {
        default: title,
        template: `%s — ${title}`,
      },
      description,
      keywords: config.meta?.keywords || undefined,
      icons: config.favicon?.url ? { icon: config.favicon.url } : undefined,
      openGraph: {
        type: (config.og?.type as "website") || "website",
        siteName: title,
        title: config.og?.title || title,
        description: config.og?.description || description,
        url: config.og?.url || undefined,
        images: config.og?.image ? [config.og.image] : undefined,
      },
    };
  } catch {
    return {
      title: {
        default: "SpaceIS Store",
        template: "%s — SpaceIS Store",
      },
      description: "Shop powered by SpaceIS SDK",
    };
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
          <ClientCartDrawer />
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
