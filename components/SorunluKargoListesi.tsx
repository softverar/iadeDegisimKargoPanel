"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import SorunluKargoDurumGuncelle from "@/components/SorunluKargoDurumGuncelle";
import SorunluKargoDuzenle from "@/components/SorunluKargoDuzenle";

interface User {
  id: number;
  username: string;
  role: "kurye" | "admin";
  name: string;
}

interface SorunluKargoListesiProps {
  user: User;
}

interface SorunluKargo {
  id: number;
  barkod_no: string;
  cikis_no: string;
  tasiyici_firma: string;
  gonderici_firma: string;
  alici_adi: string;
  aciklama: string;
  durum: string;
  created_at: string;
  foto_sayisi: number;
}

export default function SorunluKargoListesi({ user }: SorunluKargoListesiProps) {
  const router = useRouter();
  const [sorunluKargolar, setSorunluKargolar] = useState<SorunluKargo[]>([]);
  const [allSorunluKargolar, setAllSorunluKargolar] = useState<SorunluKargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [durumGuncelleId, setDurumGuncelleId] = useState<number | null>(null);
  const [duzenleId, setDuzenleId] = useState<number | null>(null);

  useEffect(() => {
    loadSorunluKargolar();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, allSorunluKargolar]);

  const loadSorunluKargolar = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/sorunlu-kargolar/list");
      const data = await response.json();

      if (data.success) {
        setAllSorunluKargolar(data.sorunluKargolar);
        setSorunluKargolar(data.sorunluKargolar);
      }
    } catch (error) {
      console.error("Error loading sorunlu kargolar:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allSorunluKargolar];

    // Arama filtresi
    if (searchTerm.trim() !== "") {
      const search = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(
        (k) =>
          k.barkod_no.toLowerCase().includes(search) ||
          k.cikis_no.toLowerCase().includes(search) ||
          k.gonderici_firma.toLowerCase().includes(search) ||
          k.alici_adi.toLowerCase().includes(search) ||
          k.aciklama.toLowerCase().includes(search)
      );
    }

    setSorunluKargolar(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Kargo Takip</h1>
              <p className="text-gray-600 mt-1">Hoşgeldin, {user.name}</p>
            </div>
            <div className="flex gap-3">
              {user.username === "müsterihizmetleri@verarkargo.com" && (
                <button
                  onClick={() => router.push("/kurye/sorunlu")}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
                >
                  <span>+</span> Yeni Kayıt Ekle
                </button>
              )}
              <button
                onClick={() => router.push("/kurye")}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Ana Menü
              </button>
            </div>
          </div>
        </div>

        {/* Arama */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Q Tüm kayıtlarda ara..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Kayıtlar */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Tüm Kayıtlar ({sorunluKargolar.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
        ) : sorunluKargolar.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Henüz sorunlu kargo kaydı bulunmamaktadır.
          </div>
        ) : (
          <div className="space-y-4">
            {sorunluKargolar.map((kargo) => (
              <div
                key={kargo.id}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-gray-800">
                        Barkod: {kargo.barkod_no}
                      </span>
                      <span className="text-gray-600">Çıkış No: {kargo.cikis_no}</span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Taşıyıcı: {kargo.tasiyici_firma}</p>
                      <p>Gönderici: {kargo.gonderici_firma}</p>
                      <p>Alıcı: {kargo.alici_adi}</p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      kargo.durum === "Yeni Kayıt"
                        ? "bg-orange-100 text-orange-800"
                        : kargo.durum === "İşlemde"
                        ? "bg-blue-100 text-blue-800"
                        : kargo.durum === "Çözüldü"
                        ? "bg-green-100 text-green-800"
                        : kargo.durum === "Ödendi"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {kargo.durum}
                  </span>
                </div>
                <p className="text-gray-700 mb-4 line-clamp-2">{kargo.aciklama}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <span>📅 {formatDate(kargo.created_at)}</span>
                    <span>📷 {kargo.foto_sayisi} fotoğraf</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {user.username === "müsterihizmetleri@verarkargo.com" && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDurumGuncelleId(kargo.id);
                          }}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-semibold"
                        >
                          🔄 Durum Güncelle
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDuzenleId(kargo.id);
                          }}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-semibold"
                        >
                          ✏️ Düzenle
                        </button>
                      </>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/kurye/sorunlu/detay/${kargo.id}`);
                      }}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-semibold"
                    >
                      👁️ Detay
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Durum Güncelle Modal */}
        {durumGuncelleId && (
          <SorunluKargoDurumGuncelle
            user={user}
            sorunluKargoId={durumGuncelleId}
            onClose={() => setDurumGuncelleId(null)}
            onSuccess={() => {
              loadSorunluKargolar();
              setDurumGuncelleId(null);
            }}
          />
        )}

        {/* Düzenle Modal */}
        {duzenleId && (
          <SorunluKargoDuzenle
            user={user}
            sorunluKargoId={duzenleId}
            onClose={() => setDuzenleId(null)}
            onSuccess={() => {
              loadSorunluKargolar();
              setDuzenleId(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

