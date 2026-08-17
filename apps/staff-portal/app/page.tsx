"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function IndexPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) return router.replace("/login");
    if (user.role === "gate-staff") return router.replace("/pickup-desk");
    router.replace(user.role === "admin" ? "/manage" : "/roster");
  }, [loading, user, router]);

  return null;
}
