import React from "react";

interface StewardLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "dark" | "light" | "monochrome";
  showWordmark?: boolean;
  className?: string;
}

export const StewardLogo: React.FC<StewardLogoProps> = ({
  size = "md",
  variant = "dark",
  showWordmark = true,
  className = "",
}) => {
  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  const iconColor =
    variant === "light"
      ? "text-white"
      : variant === "monochrome"
      ? "text-current"
      : "text-stone-900";

  const wordmarkColor =
    variant === "light"
      ? "text-white"
      : variant === "monochrome"
      ? "text-current"
      : "text-stone-900";

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Steward Checkpoint SVG Mark */}
      <svg
        className={`${iconSizes[size]} ${iconColor} shrink-0`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Steward Logo Mark"
        role="img"
      >
        {/* Outer Bracket Bounds (Boundary Gate) */}
        <path
          d="M4 8V5C4 4.44772 4.44772 4 5 4H8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M16 4H19C19.5523 4 20 4.44772 20 5V8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M20 16V19C20 19.5523 19.5523 20 19 20H16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M8 20H5C4.44772 20 4 19.5523 4 19V16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Inner Verified Action Node */}
        <rect
          x="9"
          y="9"
          width="6"
          height="6"
          rx="1"
          fill="currentColor"
        />
      </svg>

      {showWordmark && (
        <span
          className={`font-semibold tracking-tight ${textSizes[size]} ${wordmarkColor}`}
        >
          Steward
        </span>
      )}
    </div>
  );
};
