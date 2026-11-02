"use client";

import { useEffect, useRef, useState } from "react";

const DURATION_MS = 700;

/** Counts from the previously shown number to `value`; jumps straight there under reduced motion. */
export default function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      shownRef.current = value;
      setShown(value);
      return;
    }
    const from = shownRef.current;
    const startedAt = performance.now();
    let frame = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - startedAt) / DURATION_MS);
      const eased = 1 - Math.pow(1 - p, 3);
      shownRef.current = Math.round(from + (value - from) * eased);
      setShown(shownRef.current);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span style={{ fontVariantNumeric: "tabular-nums" }}>{shown}</span>;
}
