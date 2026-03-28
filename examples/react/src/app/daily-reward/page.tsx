import type { Metadata } from "next";
import { DailyRewardPage } from "@/views/DailyRewardPage";

export const metadata: Metadata = {
  title: "Daily Reward",
  description: "Claim your free daily reward.",
};

export default function Page() {
  return <DailyRewardPage />;
}
