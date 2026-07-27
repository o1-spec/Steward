"use client";

import React, { useEffect, useRef, useState } from "react";

interface RevealProps {
  children: React.ReactNode;
  variant?: "fade-up" | "fade-in" | "reveal-left" | "reveal-right";
  delayMs?: number;
  durationMs?: number;
  className?: string;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  variant = "fade-up",
  delayMs = 0,
  durationMs = 450,
  className = "",
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  useEffect(() => {
    if (prefersReducedMotion) return;

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const getVariantStyles = () => {
    switch (variant) {
      case "fade-up":
        return isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5";
      case "fade-in":
        return isVisible ? "opacity-100" : "opacity-0";
      case "reveal-left":
        return isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-5";
      case "reveal-right":
        return isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-5";
      default:
        return isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5";
    }
  };

  return (
    <div
      ref={ref}
      className={`transition-all ease-out ${getVariantStyles()} ${className}`}
      style={{
        transitionDuration: `${durationMs}ms`,
        transitionDelay: `${delayMs}ms`,
        willChange: isVisible ? "auto" : "transform, opacity",
      }}
    >
      {children}
    </div>
  );
};
