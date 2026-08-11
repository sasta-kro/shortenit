"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

import { User } from "@/lib/types";
import { api, appFetch } from "@/lib/api";
import { withoutBasePath } from "@/lib/app-path";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User, token: string, refreshToken?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const appPathname = withoutBasePath(pathname || "/");

  useEffect(() => {
    // Avoid synchronous setState warning
    const timer = setTimeout(() => setMounted(true), 0);

    const checkAuth = async () => {
      const token = localStorage.getItem("auth-token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await appFetch("/api/auth/me", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          // Optional: Update localStorage if you still use it for other things
          localStorage.setItem("auth-user", JSON.stringify(userData));
        } else {
          // If 401/403, we are not logged in. Clear local state.
          setUser(null);
          localStorage.removeItem("auth-user");
          localStorage.removeItem("auth-token");
          localStorage.removeItem("refresh-token");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    return () => clearTimeout(timer);
  }, []);

  const login = (userData: User, token: string, refreshToken?: string) => {
    localStorage.setItem("auth-user", JSON.stringify(userData));
    localStorage.setItem("auth-token", token);
    if (refreshToken) {
      localStorage.setItem("refresh-token", refreshToken);
    }
    setUser(userData);
    router.push("/");
  };

  const logout = async () => {
    // Call backend logout to invalidate token
    try {
      await api.auth.logout();
    } catch (error) {
      console.error("Logout API call failed:", error);
    }
    localStorage.removeItem("auth-user");
    localStorage.removeItem("auth-token");
    localStorage.removeItem("refresh-token");
    setUser(null);
    router.push("/auth");
  };

  useEffect(() => {
    if (!mounted || isLoading) return;

    if (appPathname.startsWith("/auth")) {
      if (user) {
        // If already logged in and on auth page, redirect to home
        router.push("/");
      }
      return;
    }

    if (!user) {
      router.push("/auth");
    }
  }, [user, isLoading, appPathname, router, mounted]);

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Prevent rendering of protected content if user is not authenticated
  // This avoids the "flash of unauthenticated content" before the redirect happens
  if (!user && !appPathname.startsWith("/auth")) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
