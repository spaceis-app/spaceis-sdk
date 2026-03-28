import { createServerClient } from "@spaceis/react/server";

export function getServerClient() {
  const shopUuid = process.env.NEXT_PUBLIC_SPACEIS_SHOP_UUID || "";
  const baseUrl =
    process.env.NEXT_PUBLIC_SPACEIS_API_URL ||
    "https://storefront-api.spaceis.app";

  if (!shopUuid) {
    throw new Error(
      "Missing NEXT_PUBLIC_SPACEIS_SHOP_UUID environment variable. " +
        "Copy .env.example to .env.local and set your shop UUID."
    );
  }

  return createServerClient({ baseUrl, shopUuid, lang: "pl" });
}
