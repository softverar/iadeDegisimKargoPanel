"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

interface User {
  id: number;
  username: string;
  role: "kurye" | "admin";
  name: string;
}

interface DegisimKargoListesiProps {
  user: User;
}

interface ExchangeCargo {
  id: number;
  alici_adi: string;
  firma: string;
  desi: number;
  created_at: string;
  kurye_name: string;
  kurye_username: string;
}

interface Kurye {
  id: number;
  name: string;
  username: string;
}

const FIRMALAR = [
  "Aras Kargo",
  "PTT",
  "Yurtiçi",
  "Sürat",
  "Kargoist",
];

export default function DegisimKargoListesi({ user }: DegisimKargoListesiProps) {
  const router = useRouter();
  const [exchangeCargos, setExchangeCargos] = useState<ExchangeCargo[]>([]);
  const [allExchangeCargos, setAllExchangeCargos] = useState<ExchangeCargo[]>([]);
  const [loadingExchangeCargos, setLoadingExchangeCargos] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // Filtreler
  const [kuryeler, setKuryeler] = useState<Kurye[]>([]);
  const [selectedKurye, setSelectedKurye] = useState<string>("");
  const [baslangicTarihi, setBaslangicTarihi] = useState<string>("");
  const [bitisTarihi, setBitisTarihi] = useState<string>("");
  const [baslangicSaati, setBaslangicSaati] = useState<string>("");
  const [bitisSaati, setBitisSaati] = useState<string>("");
  const [aliciAdiArama, setAliciAdiArama] = useState<string>("");
  const [selectedFirma, setSelectedFirma] = useState<string>("");
  const [minDesi, setMinDesi] = useState<string>("");
  const [maxDesi, setMaxDesi] = useState<string>("");

  useEffect(() => {
    loadExchangeCargos();
    loadKuryeler();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedKurye, baslangicTarihi, bitisTarihi, baslangicSaati, bitisSaati, aliciAdiArama, selectedFirma, minDesi, maxDesi, allExchangeCargos]);

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

  const loadExchangeCargos = async () => {
    setLoadingExchangeCargos(true);
    try {
      const response = await apiFetch("/api/exchange-cargos/list");
      const data = await response.json();

      if (data.success) {
        setAllExchangeCargos(data.exchangeCargos);
        setExchangeCargos(data.exchangeCargos);
      }
    } catch (error) {
      console.error("Error loading exchange cargos:", error);
    } finally {
      setLoadingExchangeCargos(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allExchangeCargos];

    // Kurye filtresi
    if (selectedKurye) {
      filtered = filtered.filter((c) => c.kurye_name === selectedKurye);
    }

    // Alıcı adı soyadı filtresi
    if (aliciAdiArama.trim() !== "") {
      filtered = filtered.filter((c) =>
        c.alici_adi.toLowerCase().includes(aliciAdiArama.trim().toLowerCase())
      );
    }

    // Kargo firması filtresi
    if (selectedFirma) {
      filtered = filtered.filter((c) => c.firma === selectedFirma);
    }

    // Desi filtresi
    if (minDesi) {
      const minDesiNum = parseFloat(minDesi);
      if (!isNaN(minDesiNum)) {
        filtered = filtered.filter((c) => c.desi >= minDesiNum);
      }
    }

    if (maxDesi) {
      const maxDesiNum = parseFloat(maxDesi);
      if (!isNaN(maxDesiNum)) {
        filtered = filtered.filter((c) => c.desi <= maxDesiNum);
      }
    }

    // Tarih filtresi
    if (baslangicTarihi) {
      const baslangic = new Date(baslangicTarihi);
      baslangic.setHours(0, 0, 0, 0);
      filtered = filtered.filter((c) => {
        const tarih = new Date(c.created_at);
        return tarih >= baslangic;
      });
    }

    if (bitisTarihi) {
      const bitis = new Date(bitisTarihi);
      bitis.setHours(23, 59, 59, 999);
      filtered = filtered.filter((c) => {
        const tarih = new Date(c.created_at);
        return tarih <= bitis;
      });
    }

    // Zaman filtresi
    if (baslangicSaati) {
      filtered = filtered.filter((c) => {
        const tarih = new Date(c.created_at);
        // Türkiye saatine göre saat ve dakika al
        const turkiyeSaati = tarih.toLocaleString("tr-TR", {
          timeZone: "Europe/Istanbul",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        const [saat, dakika] = turkiyeSaati.split(":").map(Number);
        const toplamDakika = saat * 60 + dakika;
        const [baslangicSaat, baslangicDakika] = baslangicSaati.split(":").map(Number);
        const baslangicZaman = baslangicSaat * 60 + baslangicDakika;
        return toplamDakika >= baslangicZaman;
      });
    }

    if (bitisSaati) {
      filtered = filtered.filter((c) => {
        const tarih = new Date(c.created_at);
        // Türkiye saatine göre saat ve dakika al
        const turkiyeSaati = tarih.toLocaleString("tr-TR", {
          timeZone: "Europe/Istanbul",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        const [saat, dakika] = turkiyeSaati.split(":").map(Number);
        const toplamDakika = saat * 60 + dakika;
        const [bitisSaat, bitisDakika] = bitisSaati.split(":").map(Number);
        const bitisZaman = bitisSaat * 60 + bitisDakika;
        return toplamDakika <= bitisZaman;
      });
    }

    setExchangeCargos(filtered);
  };

  const clearFilters = () => {
    setSelectedKurye("");
    setBaslangicTarihi("");
    setBitisTarihi("");
    setBaslangicSaati("");
    setBitisSaati("");
    setAliciAdiArama("");
    setSelectedFirma("");
    setMinDesi("");
    setMaxDesi("");
  };

  const handleDelete = async (cargoId: number) => {
    if (!confirm("Bu değişim kargosunu silmek istediğinizden emin misiniz?")) {
      return;
    }

    setDeletingId(cargoId);
    try {
      const response = await apiFetch(`/api/exchange-cargos/${cargoId}/delete`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        // Listeyi yenile
        await loadExchangeCargos();
      } else {
        alert(data.error || "Silme işlemi başarısız");
      }
    } catch (error) {
      console.error("Error deleting exchange cargo:", error);
      alert("Silme işlemi sırasında bir hata oluştu");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("tr-TR", {
      timeZone: "Europe/Istanbul",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Değişim Kargoları Listesi</h1>
              <p className="text-gray-600 mt-1">Hoş geldiniz, {user.name}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  clearFilters();
                  loadExchangeCargos();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Yenile
              </button>
              <button
                onClick={() => router.push(user.role === "admin" ? "/admin" : "/kurye")}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Ana Menü
              </button>
            </div>
          </div>
        </div>

        {/* Filtreler */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Filtreler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alıcı Adı Soyadı
              </label>
              <input
                type="text"
                value={aliciAdiArama}
                onChange={(e) => setAliciAdiArama(e.target.value)}
                placeholder="Alıcı adı soyadı ile ara..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kargo Firması
              </label>
              <select
                value={selectedFirma}
                onChange={(e) => setSelectedFirma(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="">Tüm Firmalar</option>
                {FIRMALAR.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Desi
              </label>
              <input
                type="number"
                value={minDesi}
                onChange={(e) => setMinDesi(e.target.value)}
                placeholder="Min desi..."
                min="0"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Desi
              </label>
              <input
                type="number"
                value={maxDesi}
                onChange={(e) => setMaxDesi(e.target.value)}
                placeholder="Max desi..."
                min="0"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kurye
              </label>
              <select
                value={selectedKurye}
                onChange={(e) => setSelectedKurye(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="">Tüm Kuryeler</option>
                {kuryeler.map((k) => (
                  <option key={k.id} value={k.name}>
                    {k.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={baslangicTarihi}
                onChange={(e) => setBaslangicTarihi(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bitiş Tarihi
              </label>
              <input
                type="date"
                value={bitisTarihi}
                onChange={(e) => setBitisTarihi(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Başlangıç Saati
              </label>
              <input
                type="time"
                value={baslangicSaati}
                onChange={(e) => setBaslangicSaati(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bitiş Saati
              </label>
              <input
                type="time"
                value={bitisSaati}
                onChange={(e) => setBitisSaati(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Filtreleri Temizle
              </button>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Toplam {exchangeCargos.length} kayıt gösteriliyor
          </div>
        </div>

        {/* Değişim Kargoları Listesi */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Değişim Kargoları ({exchangeCargos.length} kayıt)
          </h2>

          {loadingExchangeCargos ? (
            <div className="text-center py-8 text-gray-500">
              Yükleniyor...
            </div>
          ) : exchangeCargos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Henüz değişim kargosu kaydı bulunmamaktadır.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Kayıt Tarihi
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Alıcının Adı Soyadı
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Kargo Firması
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Desi
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Kaydeden Kişi
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      İşlem
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {exchangeCargos.map((cargo) => (
                    <tr
                      key={cargo.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDate(cargo.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-semibold">
                        {cargo.alici_adi}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {cargo.firma}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-semibold">
                        {cargo.desi} Desi
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {cargo.kurye_name}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDelete(cargo.id)}
                          disabled={deletingId === cargo.id}
                          className="text-red-600 hover:text-red-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Sil"
                        >
                          {deletingId === cargo.id ? "⏳" : "🗑️"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

