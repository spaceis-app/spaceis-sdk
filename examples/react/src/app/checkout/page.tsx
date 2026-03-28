"use client";

import dynamic from "next/dynamic";

const CheckoutPage = dynamic(
  () => import("@/views/CheckoutPage").then((m) => m.CheckoutPage),
  { ssr: false }
);

export default function Page() {
  return <CheckoutPage />;
}
