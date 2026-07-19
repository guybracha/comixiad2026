"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/** Animates the hero: staggered entrance + floating decorative blobs. */
export function HeroFx({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (prefersReduced) return;

      gsap.from("[data-hero-item]", {
        y: 28,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: "power3.out",
      });

      gsap.to("[data-blob='1']", {
        y: -25,
        x: 15,
        rotate: 8,
        duration: 6,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
      gsap.to("[data-blob='2']", {
        y: 20,
        x: -12,
        rotate: -6,
        duration: 7,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
      gsap.to("[data-blob='3']", {
        y: -15,
        x: -18,
        duration: 5,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className="relative overflow-hidden">
      {/* Decorative floating shapes */}
      <div
        data-blob="1"
        aria-hidden
        className="pointer-events-none absolute -left-10 top-10 size-40 rounded-full bg-primary/15 blur-2xl"
      />
      <div
        data-blob="2"
        aria-hidden
        className="pointer-events-none absolute -right-8 top-24 size-48 rounded-full bg-fuchsia-500/15 blur-2xl"
      />
      <div
        data-blob="3"
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/3 size-36 rounded-full bg-amber-400/15 blur-2xl"
      />
      {children}
    </div>
  );
}
