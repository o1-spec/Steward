import React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "success" | "amber";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className = "",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5",
  };

  const variantStyles = {
    primary:
      "bg-stone-900 text-white hover:bg-stone-800 active:bg-black shadow-xs border border-stone-900",
    secondary:
      "bg-stone-100 text-stone-900 hover:bg-stone-200 active:bg-stone-300 border border-stone-200/80",
    outline:
      "bg-white text-stone-800 border border-stone-300 hover:bg-stone-50 hover:border-stone-400 active:bg-stone-100 shadow-2xs",
    ghost:
      "bg-transparent text-stone-700 hover:bg-stone-100 active:bg-stone-200",
    destructive:
      "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-xs border border-rose-600",
    success:
      "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-xs border border-emerald-600",
    amber:
      "bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800 shadow-xs border border-amber-600",
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-1.5 h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
