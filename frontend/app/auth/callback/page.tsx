"use client";

import { useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { User, Role } from "@/lib/types";
import { withBasePath } from "@/lib/app-path";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;

    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const userEmail = searchParams.get("user");
    
    console.log("Callback triggered. Params:", {
        accessToken: accessToken ? "present" : "missing",
        refreshToken: refreshToken ? "present" : "missing",
        userEmail
    });

    if (accessToken && userEmail) {
      processedRef.current = true;
      // Construct a temporary user object.
      // We will fetch the full profile from /api/auth/me immediately after.
      const tempUser: User = {
        id: 0, // Temporary ID
        name: userEmail.split("@")[0], // Temporary Name
        email: userEmail,
        role: "USER"
      };

      login(tempUser, accessToken, refreshToken || undefined);
      // Login function redirects to /, but we rely on AuthProvider to check /api/auth/me
      // Force redirect just in case
      window.location.href = withBasePath("/");
    } else if (!accessToken) {
        // Only error if we really don't have tokens and we haven't processed yet
         console.error("Missing tokens in callback URL");
         // router.push("/auth?error=missing_token");
    }
  }, [searchParams, login, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div></div>}>
      <CallbackContent />
    </Suspense>
  );
}
