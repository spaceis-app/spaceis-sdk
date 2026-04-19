"use client";

import { useState } from "react";
import { useSpaceIS, useRecaptcha } from "@spaceis/react";
import { getErrorMessage } from "@/lib/helpers";
import { toast } from "sonner";

export function DailyRewardPage() {
  const { client } = useSpaceIS();
  const { execute: executeRecaptcha } = useRecaptcha();

  const [nick, setNick] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const handleClaim = async () => {
    if (!nick.trim()) {
      toast.error("Player nickname is required");
      return;
    }

    setResult(null);
    setLoading(true);

    try {
      const token = await executeRecaptcha("daily_reward");
      const res = await client.dailyRewards.claim({
        nick: nick.trim(),
        "g-recaptcha-response": token,
      });
      const msg = res.message || "Daily reward claimed!";
      setResult({ message: msg, type: "success" });
      toast.success(msg);
    } catch (err) {
      const msg = getErrorMessage(err);
      setResult({ message: msg, type: "error" });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container voucher-layout">
      <div className="voucher-card">
        <div className="voucher-card-title">Daily reward</div>
        <div className="voucher-card-desc">
          Claim a free reward — resets every 24 hours.
        </div>

        <div className="voucher-form">
          <div className="form-field">
            <label className="form-label" htmlFor="daily-nick">
              Player nickname *
            </label>
            <input
              type="text"
              id="daily-nick"
              placeholder="Steve"
              autoComplete="off"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleClaim();
              }}
            />
          </div>
          <button
            className="voucher-submit success-btn"
            disabled={loading}
            onClick={handleClaim}
          >
            {loading ? "Claiming..." : "Claim reward"}
          </button>
        </div>

        {result && (
          <div className={`result-box show ${result.type}`}>
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}
