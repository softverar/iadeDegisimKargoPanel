"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTabId, getTabRole, setTabRole } from "@/lib/tab-session";
import { apiFetch } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<"kurye" | "admin">("kurye");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Tab ID'yi oluştur (eğer yoksa)
    getTabId();
    
    // Önce tab role'ü kontrol et
    const tabRole = getTabRole();
    
    // Eğer tab role varsa, o role'e göre yönlendir
    if (tabRole) {
      if (tabRole === "admin") {
        router.push("/admin");
      } else {
        router.push("/kurye");
      }
      return;
    }
    
    // Tab role yoksa, kullanıcı kontrolü yap
    const checkAuth = async () => {
      try {
        const response = await apiFetch("/api/auth/check");
        const data = await response.json();

        if (data.success && data.user) {
          // Tab role'ü kaydet
          setTabRole(data.user.role);
          
          // Kullanıcı zaten giriş yapmış, ilgili sayfaya yönlendir
          if (data.user.role === "admin") {
            router.push("/admin");
          } else {
            router.push("/kurye");
          }
          return;
        }
      } catch (error) {
        // Hata durumunda login sayfasında kal
      }
      setChecking(false);
    };

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const tabId = getTabId();
      const response = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password, role: loginType, tabId }),
      });

      const data = await response.json();

      if (data.success) {
        // Tab role'ü kaydet
        setTabRole(loginType);
        
        if (loginType === "admin") {
          router.push("/admin");
        } else {
          router.push("/kurye");
        }
        router.refresh();
      } else {
        setError(data.error || "Giriş başarısız");
      }
    } catch (err) {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Kurye Barkod Sistemi
        </h1>

        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => setLoginType("kurye")}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
              loginType === "kurye"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Kurye Girişi
          </button>
          <button
            type="button"
            onClick={() => setLoginType("admin")}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
              loginType === "admin"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Admin Girişi
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="Kullanıcı adınızı girin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="Şifrenizi girin"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}

