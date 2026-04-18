"use client";

import dynamic from "next/dynamic";

const CartPage = dynamic(
  () => import("@/features/cart/CartPage").then((m) => m.CartPage),
  { ssr: false }
);

export default function Page() {
  return <CartPage />;
}
