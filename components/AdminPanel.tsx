"use client";

import { useRouter } from "next/navigation";
import { getTabId, clearTabSession } from "@/lib/tab-session";
import { apiFetch } from "@/lib/api-client";

interface User {
  id: number;
  username: string;
  role: "kurye" | "admin";
  name: string;
}

interface AdminPanelProps {
  user: User;
}

export default function AdminPanel({ user }: AdminPanelProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const tabId = getTabId();
    await apiFetch("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ tabId }),
    });
    clearTabSession();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Admin Paneli</h1>
              <p className="text-gray-600 mt-1">Hoş geldiniz, {user.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Çıkış Yap
            </button>
          </div>
        </div>

        {/* Menü */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={() => router.push("/admin/iade")}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow text-left group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                  İade Kargo Listesi
                </h2>
                <p className="text-gray-600">
                  İade kargolarının listesini görüntüleyin ve detaylarına bakın
                </p>
              </div>
              <div className="text-4xl">📦</div>
            </div>
          </button>

          <button
            onClick={() => router.push("/admin/degisim")}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow text-left group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
                  Değişim Kargo Listesi
                </h2>
                <p className="text-gray-600">
                  Değişim kargolarının listesini görüntüleyin
                </p>
              </div>
              <div className="text-4xl">🔄</div>
            </div>
          </button>

          <button
            onClick={() => router.push("/admin/sorunlu")}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow text-left group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-red-600 transition-colors">
                  Sorunlu Kargo Listesi
                </h2>
                <p className="text-gray-600">
                  Sorunlu kargo kayıtlarını görüntüleyin ve yönetin
                </p>
              </div>
              <div className="text-4xl">⚠️</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}





