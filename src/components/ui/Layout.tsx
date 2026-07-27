import React from "react";

export interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const PageContainer: React.FC<LayoutProps> = ({ children, className = "" }) => {
  return (
    <div className={`max-w-6xl mx-auto px-4 sm:px-6 md:px-8 w-full ${className}`}>
      {children}
    </div>
  );
};

export const Section: React.FC<LayoutProps & { bg?: "warm" | "white" | "dark" }> = ({
  children,
  className = "",
  id,
  bg = "warm",
}) => {
  const bgStyles =
    bg === "white"
      ? "bg-white border-t border-stone-200/80"
      : bg === "dark"
      ? "bg-stone-900 text-white"
      : "bg-[#FAF8F5]";

  return (
    <section
      id={id}
      className={`py-12 sm:py-16 md:py-20 lg:py-24 relative overflow-hidden ${bgStyles} ${className}`}
    >
      {children}
    </section>
  );
};

export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  eyebrow?: string;
  centered?: boolean;
  className?: string;
}> = ({ title, subtitle, eyebrow, centered = true, className = "" }) => {
  return (
    <div
      className={`max-w-2xl ${
        centered ? "mx-auto text-center" : ""
      } space-y-2 mb-10 sm:mb-12 ${className}`}
    >
      {eyebrow && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-[11px] font-medium text-stone-600">
          {eyebrow}
        </div>
      )}
      <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-stone-900 tracking-tight leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export const ContentGrid: React.FC<LayoutProps & { cols?: 2 | 3 | 4 }> = ({
  children,
  className = "",
  cols = 3,
}) => {
  const colStyles =
    cols === 2
      ? "grid-cols-1 md:grid-cols-2"
      : cols === 4
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      : "grid-cols-1 md:grid-cols-3";

  return <div className={`grid ${colStyles} gap-6 ${className}`}>{children}</div>;
};

export const Stack: React.FC<LayoutProps & { gap?: 2 | 3 | 4 | 6 | 8 }> = ({
  children,
  className = "",
  gap = 4,
}) => {
  const gapStyles = {
    2: "space-y-2",
    3: "space-y-3",
    4: "space-y-4",
    6: "space-y-6",
    8: "space-y-8",
  }[gap];

  return <div className={`${gapStyles} ${className}`}>{children}</div>;
};

export const Cluster: React.FC<LayoutProps & { align?: "start" | "center" | "between" }> = ({
  children,
  className = "",
  align = "center",
}) => {
  const alignStyles =
    align === "between"
      ? "justify-between items-center"
      : align === "start"
      ? "justify-start items-center"
      : "justify-center items-center";

  return <div className={`flex flex-wrap gap-3 ${alignStyles} ${className}`}>{children}</div>;
};
