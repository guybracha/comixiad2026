"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Reveals direct children (or [data-reveal] descendants) with a staggered
 * rise-in as the section scrolls into view.
 */
export function Reveal({
  children,
  selector = "[data-reveal]",
  className,
}: {
  children: React.ReactNode;
  selector?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (prefersReduced) return;

      const targets = ref.current?.querySelectorAll(selector);
      if (!targets || targets.length === 0) return;

      gsap.from(targets, {
        y: 24,
        opacity: 0,
        duration: 0.55,
        stagger: 0.06,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
          once: true,
        },
      });
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
