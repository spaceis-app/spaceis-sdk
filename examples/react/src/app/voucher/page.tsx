import type { Metadata } from "next";
import { VoucherPage } from "@/views/VoucherPage";

export const metadata: Metadata = {
  title: "Voucher",
  description: "Redeem a voucher code.",
};

export default function Page() {
  return <VoucherPage />;
}
