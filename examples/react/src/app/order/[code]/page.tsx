import type { Metadata } from "next";
import { OrderSummaryPage } from "@/views/OrderSummaryPage";

export const metadata: Metadata = {
  title: "Order Summary",
  description: "Check your order status and details.",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <OrderSummaryPage code={code} />;
}
