import React from "react";

export type BadgeVariant =
  | "completed"
  | "running"
  | "waiting"
  | "failed"
  | "cancelled"
  | "neutral"
  | "brand"
  | "high"
  | "medium"
  | "low";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "neutral",
  children,
  className = "",
  size = "md",
}) => {
  const sizeStyles = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2 py-0.5 text-xs",
  };

  const variantStyles: Record<BadgeVariant, string> = {
    completed: "bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium",
    running: "bg-blue-50 text-blue-700 border border-blue-200/80 font-medium animate-pulse-subtle",
    waiting: "bg-amber-50 text-amber-700 border border-amber-200/80 font-medium",
    failed: "bg-rose-50 text-rose-700 border border-rose-200/80 font-medium",
    cancelled: "bg-stone-100 text-stone-600 border border-stone-200 font-medium",
    neutral: "bg-stone-100 text-stone-700 border border-stone-200 font-medium",
    brand: "bg-blue-50 text-blue-700 border border-blue-200 font-medium",
    high: "bg-rose-100 text-rose-800 border border-rose-200 font-semibold",
    medium: "bg-amber-100 text-amber-800 border border-amber-200 font-medium",
    low: "bg-stone-100 text-stone-700 border border-stone-200 font-normal",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-mono ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
