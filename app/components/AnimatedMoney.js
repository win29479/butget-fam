"use client";

import { useEffect, useRef } from "react";
import { money } from "../lib/budget";

function reducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export default function AnimatedMoney({ value, as: Tag = "span", duration = 650, ...rest }) {
  const ref = useRef(null);
  const fromRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const from = fromRef.current;
    const target = Number(value || 0);

    if (from === target || reducedMotion()) {
      el.textContent = money(target);
      fromRef.current = target;
      return;
    }

    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const v = from + (target - from) * easeOutCubic(t);
      el.textContent = money(Math.round(v));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <Tag ref={ref} {...rest}>
      {money(0)}
    </Tag>
  );
}
