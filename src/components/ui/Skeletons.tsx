import React from "react";

export const SkeletonBox: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div
      className={`bg-stone-200/70 rounded motion-safe:animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
};

export const RunListSkeleton: React.FC = () => {
  return (
    <div className="space-y-3 p-4">
      <SkeletonBox className="h-8 w-1/3 mb-4" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-3 bg-white border border-stone-200 rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <SkeletonBox className="h-4 w-24" />
            <SkeletonBox className="h-4 w-12" />
          </div>
          <SkeletonBox className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
};

export const TimelineSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center border-b border-stone-200 pb-3">
        <SkeletonBox className="h-5 w-40" />
        <SkeletonBox className="h-4 w-16" />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-3.5 bg-stone-50 border border-stone-200 rounded-lg space-y-2">
          <div className="flex justify-between">
            <SkeletonBox className="h-4 w-28" />
            <SkeletonBox className="h-3 w-16" />
          </div>
          <SkeletonBox className="h-3 w-5/6" />
        </div>
      ))}
    </div>
  );
};

export const ApprovalSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 p-4">
      <SkeletonBox className="h-6 w-36 mb-4" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 bg-white border border-stone-200 rounded-xl space-y-3">
          <div className="flex justify-between items-center">
            <SkeletonBox className="h-5 w-32" />
            <SkeletonBox className="h-4 w-16" />
          </div>
          <SkeletonBox className="h-3 w-1/2" />
          <SkeletonBox className="h-16 w-full rounded-md" />
          <div className="flex gap-2 pt-2">
            <SkeletonBox className="h-8 w-1/2" />
            <SkeletonBox className="h-8 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SettingsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <div className="space-y-2">
        <SkeletonBox className="h-7 w-48" />
        <SkeletonBox className="h-4 w-72" />
      </div>
      <div className="border border-stone-200 rounded-xl p-6 bg-white space-y-4">
        <SkeletonBox className="h-5 w-36" />
        <SkeletonBox className="h-10 w-full" />
        <SkeletonBox className="h-10 w-full" />
      </div>
    </div>
  );
};
