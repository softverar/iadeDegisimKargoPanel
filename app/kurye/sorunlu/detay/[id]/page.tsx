"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getTabId, setTabRole } from "@/lib/tab-session";
import { apiFetch } from "@/lib/api-client";
import SorunluKargoDetay from "@/components/SorunluKargoDetay";

interface User {
  id: number;
  username: string;
  role: "kurye" | "admin";
  name: string;
}

export default function SorunluKargoDetayPage() {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tab ID'yi oluştur (eğer yoksa)
    getTabId();
    
    const loadUser = async () => {
      try {
        const response = await apiFetch("/api/auth/check");
        const data = await response.json();

        if (data.success && data.user) {
          if (data.user.role !== "kurye") {
            router.push("/admin");
            return;
          }
          setTabRole("kurye");
          setUser(data.user);
        } else {
          router.push("/");
        }
      } catch (error) {
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const sorunluKargoId = parseInt(params.id as string);

  return <SorunluKargoDetay user={user} sorunluKargoId={sorunluKargoId} />;
}


