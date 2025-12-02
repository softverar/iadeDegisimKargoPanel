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

interface SorunluKargoAdminListesiProps {
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
  kullanici_name: string;
  kullanici_username: string;
  foto_sayisi: number;
}

interface Kurye {
  id: number;
  name: string;
  username: string;
}

const DURUMLAR = ["Tümü", "Yeni Kayıt", "İşlemde", "Çözüldü", "Ödendi", "Reddedildi"];

export default function SorunluKargoAdminListesi({ user }: SorunluKargoAdminListesiProps) {
  const router = useRouter();
  const [sorunluKargolar, setSorunluKargolar] = useState<SorunluKargo[]>([]);
  const [allSorunluKargolar, setAllSorunluKargolar] = useState<SorunluKargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [durumGuncelleId, setDurumGuncelleId] = useState<number | null>(null);
  const [duzenleId, setDuzenleId] = useState<number | null>(null);
  
  // Filtreler
  const [kuryeler, setKuryeler] = useState<Kurye[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDurum, setSelectedDurum] = useState("Tümü");
  const [selectedKurye, setSelectedKurye] = useState("Tümü");

  useEffect(() => {
    loadSorunluKargolar();
    loadKuryeler();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedDurum, selectedKurye, allSorunluKargolar]);

  const loadKuryeler = async () => {
    try {
      const response = await apiFetch("/api/users/kurye-list");
      const data = await response.json();

      if (data.success) {
        setKuryeler(data.kuryeler);
      }
    } catch (error) {
      console.error("Error loading kuryeler:", error);
    }
  };

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

    // Durum filtresi
    if (selectedDurum !== "Tümü") {
      filtered = filtered.filter((k) => k.durum === selectedDurum);
    }

    // Kurye filtresi
    if (selectedKurye !== "Tümü") {
      filtered = filtered.filter((k) => k.kullanici_name === selectedKurye);
    }

    setSorunluKargolar(filtered);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu kaydı silmek istediğinizden emin misiniz?")) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await apiFetch(`/api/sorunlu-kargolar/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        await loadSorunluKargolar();
      } else {
        alert(data.error || "Silme işlemi başarısız");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Silme işlemi sırasında bir hata oluştu");
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDurum("Tümü");
    setSelectedKurye("Tümü");
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
              <h1 className="text-2xl font-bold text-gray-800">Yönetici Paneli</h1>
              <p className="text-gray-600 mt-1">Hoşgeldin, {user.name}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/admin")}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Ana Menü
              </button>
            </div>
          </div>
        </div>

        {/* Özet */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl">📦</div>
            <div>
              <p className="text-sm text-gray-600">Toplam Sorunlu Kargo Kaydı</p>
              <p className="text-3xl font-bold text-gray-800">{allSorunluKargolar.length}</p>
            </div>
          </div>
        </div>

        {/* Filtreler */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🔍</span>
            <h2 className="text-xl font-semibold text-gray-800">Filtreler</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arama
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Barkod, çıkış no, firma, alıcı veya açıklama..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durum
              </label>
              <select
                value={selectedDurum}
                onChange={(e) => setSelectedDurum(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                {DURUMLAR.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kullanıcı
              </label>
              <select
                value={selectedKurye}
                onChange={(e) => setSelectedKurye(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="Tümü">Tümü</option>
                {kuryeler.map((k) => (
                  <option key={k.id} value={k.name}>
                    {k.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Temizle
            </button>
          </div>
        </div>

        {/* Tablo */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Tüm Kayıtlar ({sorunluKargolar.length})
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
          ) : sorunluKargolar.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Henüz sorunlu kargo kaydı bulunmamaktadır.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      BARKOD NO
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      ÇIKIŞ NO
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      TAŞIYICI
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      GÖNDERİCİ
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      ALICI
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      AÇIKLAMA
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      DURUM
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      OLUŞTURAN
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      TARİH
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      İŞLEMLER
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sorunluKargolar.map((kargo) => (
                    <tr key={kargo.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">{kargo.barkod_no}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{kargo.cikis_no}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{kargo.tasiyici_firma}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{kargo.gonderici_firma}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{kargo.alici_adi}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                        {kargo.aciklama}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
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
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex items-center gap-1">
                          <span>👤</span>
                          {kargo.kullanici_name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex items-center gap-1">
                          <span>📅</span>
                          {formatDate(kargo.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => router.push(`/admin/sorunlu/detay/${kargo.id}`)}
                            className="text-green-600 hover:text-green-800 font-semibold"
                            title="Görüntüle"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => setDurumGuncelleId(kargo.id)}
                            className="text-purple-600 hover:text-purple-800 font-semibold"
                            title="Durum Güncelle"
                          >
                            🔄
                          </button>
                          <button
                            onClick={() => setDuzenleId(kargo.id)}
                            className="text-blue-600 hover:text-blue-800 font-semibold"
                            title="Kayıt Düzenle"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(kargo.id)}
                            disabled={deletingId === kargo.id}
                            className="text-red-600 hover:text-red-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Sil"
                          >
                            {deletingId === kargo.id ? "⏳" : "🗑️"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

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

