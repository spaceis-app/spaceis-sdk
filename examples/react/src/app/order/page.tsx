import type { Metadata } from "next";
import { OrderSummaryPage } from "@/features/order/OrderSummaryPage";

export const metadata: Metadata = {
  title: "Order Summary",
  description: "Check your order status and details.",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  return <OrderSummaryPage code={order} />;
}