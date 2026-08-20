"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useSession, homeFor } from "@/lib/session";

/** Routes to setup, sign-in, or the role's home depending on system + session state. */
export default function IndexPage() {
  const { user, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace(homeFor(user.role));
      return;
    }
    api.setup
      .status()
      .then((s) => router.replace(s.initialised ? "/login" : "/setup"))
      .catch(() => router.replace("/login"));
  }, [loading, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-brand-link" />
    </div>
  );
}
