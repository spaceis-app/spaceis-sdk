import type { Metadata } from "next";
import { VoucherPage } from "@/features/voucher/VoucherPage";

export const metadata: Metadata = {
  title: "Voucher",
  description: "Redeem a voucher code.",
};

export default function Page() {
  return <VoucherPage />;
}
