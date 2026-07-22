"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function Banner() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (!error) return null;

  return (
    <div className="mb-4 px-4 py-3 rounded-lg bg-rose-500/[0.08] border border-rose-500/20 text-left">
      <p className="text-[0.75rem] text-rose-400 font-medium">Access Denied</p>
      <p className="text-[0.65rem] text-rose-400/70 mt-0.5">
        Your account is not authorized to access this dashboard. Only approved users can sign in.
      </p>
    </div>
  );
}

export function AccessDeniedBanner() {
  return (
    <Suspense fallback={null}>
      <Banner />
    </Suspense>
  );
}
