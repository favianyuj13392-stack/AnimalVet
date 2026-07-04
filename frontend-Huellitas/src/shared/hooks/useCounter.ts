"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

export function useCounter(end: number, duration = 1800, decimals = 0) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;

    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(parseFloat((eased * end).toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(step);
      else setValue(end);
    };

    requestAnimationFrame(step);
  }, [inView, end, duration, decimals]);

  return { ref, value };
}
