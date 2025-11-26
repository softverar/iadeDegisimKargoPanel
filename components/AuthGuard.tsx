"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getTabId, getTabRole, setTabRole, clearTabSession } from "@/lib/tab-session";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "kurye" | "admin";
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const tabId = getTabId();
      const tabRole = getTabRole();

      // Eğer tab role varsa ve sayfa yolu ile uyumluysa, doğrudan geç
      if (tabRole && requiredRole && tabRole === requiredRole) {
        setIsChecking(false);
        return;
      }

      // Tab ID ile kullanıcı kontrolü yap
      try {
        const response = await fetch("/api/auth/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tabId }),
        });

        const data = await response.json();

        if (data.success && data.user) {
          // Kullanıcı giriş yapmış, role'ü kaydet
          setTabRole(data.user.role);

          // Eğer sayfa yolu ile role uyumsuzsa yönlendir
          if (requiredRole && data.user.role !== requiredRole) {
            if (data.user.role === "admin") {
              router.push("/admin");
            } else {
              router.push("/kurye");
            }
            return;
          }

          setIsChecking(false);
        } else {
          // Giriş yapmamış, login sayfasına yönlendir
          clearTabSession();
          router.push("/");
        }
      } catch (error) {
        clearTabSession();
        router.push("/");
      }
    };

    checkAuth();
  }, [pathname, router, requiredRole]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}



