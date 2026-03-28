"use client";

import { useState } from "react";
import { useSpaceIS, useRecaptcha } from "@spaceis/react";
import { getErrorMessage } from "../helpers";
import { toast } from "sonner";

export function VoucherPage() {
  const { client } = useSpaceIS();
  const { execute: executeRecaptcha } = useRecaptcha();

  const [nick, setNick] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const handleRedeem = async () => {
    if (!nick.trim()) {
      toast.error("Player nickname is required");
      return;
    }
    if (!code.trim()) {
      toast.error("Voucher code is required");
      return;
    }

    setResult(null);
    setLoading(true);

    try {
      const token = await executeRecaptcha("voucher");
      const res = await client.vouchers.redeem({
        nick: nick.trim(),
        code: code.trim(),
        "g-recaptcha-response": token,
      });
      const msg = res.message || "Voucher redeemed!";
      setResult({ message: msg, type: "success" });
      toast.success(msg);
      setCode("");
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
        <div className="voucher-card-title">Redeem voucher</div>
        <div className="voucher-card-desc">
          Enter your player nickname and voucher code to redeem it.
        </div>

        <div className="voucher-form">
          <div className="form-field">
            <label className="form-label" htmlFor="voucher-nick">
              Player nickname *
            </label>
            <input
              type="text"
              id="voucher-nick"
              placeholder="Steve"
              autoComplete="off"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="voucher-code">
              Voucher code *
            </label>
            <input
              type="text"
              id="voucher-code"
              placeholder="ABCD-1234-EFGH"
              autoComplete="off"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRedeem();
              }}
              style={{
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: "var(--mono)",
              }}
            />
          </div>
          <button
            className="voucher-submit"
            disabled={loading}
            onClick={handleRedeem}
          >
            {loading ? "Checking..." : "Redeem voucher"}
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
