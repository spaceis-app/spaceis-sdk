import type { Metadata } from "next";
import { DailyRewardPage } from "@/features/daily-reward/DailyRewardPage";

export const metadata: Metadata = {
  title: "Daily Reward",
  description: "Claim your free daily reward.",
};

export default function Page() {
  return <DailyRewardPage />;
}
