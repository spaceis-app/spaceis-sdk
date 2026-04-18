"use client";

import dynamic from "next/dynamic";

const CheckoutPage = dynamic(
  () => import("@/features/checkout/CheckoutPage").then((m) => m.CheckoutPage),
  { ssr: false }
);

export default function Page() {
  return <CheckoutPage />;
}
