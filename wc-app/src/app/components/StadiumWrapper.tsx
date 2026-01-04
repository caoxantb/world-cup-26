"use client";

import React from "react";
import dynamic from "next/dynamic";

const StadiumSkeleton = () => (
  <div className="relative inline-block aspect-[16/9] w-full overflow-hidden bg-[linear-gradient(135deg,#f8fafc,#f1f5f9,#e5e7eb)]">
    <div className="absolute inset-0 animate-pulse bg-slate-200/30" />
    <div className="absolute inset-0 flex items-end">
      <div className="flex flex-col gap-1 px-6 pb-6 text-slate-500">
        <div className="h-3 w-28 animate-pulse rounded-full bg-slate-200" />
        <div className="h-7 w-72 animate-pulse rounded-md bg-slate-200" />
        <div className="h-4 w-40 animate-pulse rounded-md bg-slate-200" />
      </div>
    </div>
  </div>
);

const StadiumErrorFallback = () => (
  <div className="relative inline-block aspect-[16/9] w-full overflow-hidden">
    <div className="absolute inset-0 flex items-center justify-center bg-red-900/80 text-red-50">
      <div className="rounded-lg border border-red-400/60 bg-red-900/60 px-6 py-4 text-center shadow-lg shadow-red-900/40">
        <p className="text-lg font-semibold">Stadium failed to load</p>
        <p className="mt-2 text-sm text-red-100/90">
          Please refresh or enable WebGL in your browser settings.
        </p>
      </div>
    </div>
  </div>
);

class StadiumErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Stadium render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return <StadiumErrorFallback />;
    }

    return this.props.children;
  }
}

const Stadium = dynamic(() => import("@/app/components/Stadium"), {
  ssr: false,
  loading: () => <StadiumSkeleton />,
});

export default function StadiumWrapper({ flag }: { flag: string }) {
  return (
    <StadiumErrorBoundary key={flag}>
      <Stadium flag={flag} />
    </StadiumErrorBoundary>
  );
}
