"use client";

import React, { useEffect, useState } from "react";
import { StewardLogo } from "./StewardLogo";

interface StewardLoaderProps {
  onComplete?: () => void;
  minDisplayMs?: number;
}

export const StewardLoader: React.FC<StewardLoaderProps> = ({
  onComplete,
  minDisplayMs = 450,
}) => {
  // Always initialize to true so SSR and initial client hydration HTML match 100%
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [prefersReducedMotion] = useState(false);
  const [progress, setProgress] = useState(20);

  useEffect(() => {
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const alreadyShown = sessionStorage.getItem("stwd_intro_shown") === "true";
    const effectiveDisplayMs = alreadyShown || isReducedMotion ? 200 : minDisplayMs;

    // Progress bar fill animation (black bar)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 35;
      });
    }, 90);

    const timer = setTimeout(() => {
      setProgress(100);
      setIsFading(true);

      const removeTimer = setTimeout(() => {
        setIsVisible(false);
        sessionStorage.setItem("stwd_intro_shown", "true");
        if (onComplete) onComplete();
      }, 200);

      return () => clearTimeout(removeTimer);
    }, effectiveDisplayMs);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [minDisplayMs, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-label="Loading Steward"
      className={`fixed inset-0 z-50 bg-stone-warm flex flex-col items-center justify-center transition-opacity duration-200 ${isFading ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
    >
      <div className="flex flex-col items-center gap-5 text-stone-900">
        <StewardLogo size="lg" variant="dark" />

        {/* Sleek Black Progress Line */}
        {!prefersReducedMotion ? (
          <div className="w-36 h-0.5 bg-stone-300/80 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-stone-900 transition-all duration-150 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : (
          <div className="text-xs font-mono text-stone-500">Initializing...</div>
        )}
      </div>

      <span className="sr-only">Loading Steward</span>
    </div>
  );
};
