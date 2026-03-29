"use client";

import { useState, useEffect, useCallback } from "react";
import { useProduct, getProductLimits, snapQuantity } from "@spaceis/react";

interface QtyInputProps {
  value: number;
  slug: string;
  onSet: (qty: number) => void;
}

export function QtyInput({ value, slug, onSet }: QtyInputProps) {
  const { data: product } = useProduct(slug);
  const limits = product ? getProductLimits(product) : { min: 1, max: 99, step: 1 };

  const [inputVal, setInputVal] = useState(String(value));

  useEffect(() => {
    setInputVal(String(value));
  }, [value]);

  const commit = useCallback(() => {
    if (!product) {
      setInputVal(String(value));
      return;
    }
    let n = parseInt(inputVal, 10);
    if (isNaN(n)) n = value;
    n = snapQuantity(n, limits);
    setInputVal(String(n));
    if (n !== value) {
      onSet(n);
    }
  }, [inputVal, value, limits, onSet, product]);

  return (
    <input
      className="qty-input"
      type="text"
      inputMode="numeric"
      value={inputVal}
      onChange={(e) => setInputVal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
    />
  );
}
