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

interface IadeKargoListesiProps {
  user: User;
}

interface Transaction {
  id: number;
  firma: string;
  adet: number;
  created_at: string;
  kurye_name: string;
  kurye_username: string;
}

interface TransactionDetail {
  transaction: Transaction;
  barcodes: string[];
}

interface Kurye {
  id: number;
  name: string;
  username: string;
}

export default function IadeKargoListesi({ user }: IadeKargoListesiProps) {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // Filtreler
  const [kuryeler, setKuryeler] = useState<Kurye[]>([]);
  const [selectedKurye, setSelectedKurye] = useState<string>("");
  const [baslangicTarihi, setBaslangicTarihi] = useState<string>("");
  const [bitisTarihi, setBitisTarihi] = useState<string>("");
  const [baslangicSaati, setBaslangicSaati] = useState<string>("");
  const [bitisSaati, setBitisSaati] = useState<string>("");
  const [barcodeSearch, setBarcodeSearch] = useState<string>("");

  useEffect(() => {
    loadTransactions();
    loadKuryeler();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedKurye, baslangicTarihi, bitisTarihi, baslangicSaati, bitisSaati, allTransactions]);

  useEffect(() => {
    // Barkod araması için debounce ekle
    const timeoutId = setTimeout(() => {
      if (barcodeSearch.trim() !== "") {
        searchByBarcode(barcodeSearch.trim());
      } else {
        // Barkod araması boşsa normal listeyi yükle
        loadTransactions();
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [barcodeSearch]);

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

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/transactions/list");
      const data = await response.json();

      if (data.success) {
        setAllTransactions(data.transactions);
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchByBarcode = async (barcode: string) => {
    setLoading(true);
    try {
      const response = await apiFetch(`/api/transactions/list?barcode=${encodeURIComponent(barcode)}`);
      const data = await response.json();

      if (data.success) {
        setAllTransactions(data.transactions);
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error("Error searching by barcode:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allTransactions];

    // Kurye filtresi
    if (selectedKurye) {
      filtered = filtered.filter((t) => t.kurye_name === selectedKurye);
    }

    // Tarih filtresi
    if (baslangicTarihi) {
      const baslangic = new Date(baslangicTarihi);
      baslangic.setHours(0, 0, 0, 0);
      filtered = filtered.filter((t) => {
        const tarih = new Date(t.created_at);
        return tarih >= baslangic;
      });
    }

    if (bitisTarihi) {
      const bitis = new Date(bitisTarihi);
      bitis.setHours(23, 59, 59, 999);
      filtered = filtered.filter((t) => {
        const tarih = new Date(t.created_at);
        return tarih <= bitis;
      });
    }

    // Zaman filtresi
    if (baslangicSaati) {
      filtered = filtered.filter((t) => {
        const tarih = new Date(t.created_at);
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
      filtered = filtered.filter((t) => {
        const tarih = new Date(t.created_at);
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

    setTransactions(filtered);
  };

  const clearFilters = () => {
    setSelectedKurye("");
    setBaslangicTarihi("");
    setBitisTarihi("");
    setBaslangicSaati("");
    setBitisSaati("");
    setBarcodeSearch("");
  };

  const handleDelete = async (transactionId: number) => {
    if (!confirm("Bu işlemi silmek istediğinizden emin misiniz?")) {
      return;
    }

    setDeletingId(transactionId);
    try {
      const response = await apiFetch(`/api/transactions/${transactionId}/delete`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        // Listeyi yenile
        await loadTransactions();
        // Eğer silinen işlem seçiliyse, seçimi temizle
        if (selectedTransaction && selectedTransaction.transaction.id === transactionId) {
          setSelectedTransaction(null);
        }
      } else {
        alert(data.error || "Silme işlemi başarısız");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Silme işlemi sırasında bir hata oluştu");
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewDetail = async (transactionId: number) => {
    setLoadingDetail(true);
    try {
      const response = await apiFetch(`/api/transactions/${transactionId}`);
      const data = await response.json();

      if (data.success) {
        setSelectedTransaction(data);
      } else {
        alert(data.error || "Detay alınamadı");
      }
    } catch (error) {
      console.error("Error loading detail:", error);
      alert("Detay yüklenirken bir hata oluştu");
    } finally {
      setLoadingDetail(false);
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
              <h1 className="text-2xl font-bold text-gray-800">İade Kargo Listesi</h1>
              <p className="text-gray-600 mt-1">Hoş geldiniz, {user.name}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  clearFilters();
                  loadTransactions();
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
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barkod ile Ara
              </label>
              <input
                type="text"
                value={barcodeSearch}
                onChange={(e) => setBarcodeSearch(e.target.value)}
                placeholder="Barkod numarasını girin..."
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
            Toplam {transactions.length} kayıt gösteriliyor
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Özet Liste */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                İşlem Listesi ({transactions.length} kayıt)
              </h2>

              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  Yükleniyor...
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Henüz işlem kaydı bulunmamaktadır.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Okutulma Tarihi
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Okutulan Firma
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Okutan Kişi
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Okutulan Adet
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                          Detay
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                          İşlem
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {formatDate(transaction.created_at)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {transaction.firma}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {transaction.kurye_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 font-semibold">
                            {transaction.adet} Adet
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleViewDetail(transaction.id)}
                              disabled={loadingDetail}
                              className="text-blue-600 hover:text-blue-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Detayları Görüntüle"
                            >
                              👁️
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleDelete(transaction.id)}
                              disabled={deletingId === transaction.id}
                              className="text-red-600 hover:text-red-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Sil"
                            >
                              {deletingId === transaction.id ? "⏳" : "🗑️"}
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

          {/* Detay Paneli */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Detay Bilgileri
              </h2>

              {loadingDetail ? (
                <div className="text-center py-8 text-gray-500">
                  Yükleniyor...
                </div>
              ) : selectedTransaction ? (
                <div className="space-y-4">
                  <div className="border-b border-gray-200 pb-3">
                    <p className="text-sm text-gray-600">Firma</p>
                    <p className="font-semibold text-gray-800">
                      {selectedTransaction.transaction.firma}
                    </p>
                  </div>
                  <div className="border-b border-gray-200 pb-3">
                    <p className="text-sm text-gray-600">Kurye</p>
                    <p className="font-semibold text-gray-800">
                      {selectedTransaction.transaction.kurye_name}
                    </p>
                  </div>
                  <div className="border-b border-gray-200 pb-3">
                    <p className="text-sm text-gray-600">Tarih</p>
                    <p className="font-semibold text-gray-800">
                      {formatDate(selectedTransaction.transaction.created_at)}
                    </p>
                  </div>
                  <div className="border-b border-gray-200 pb-3">
                    <p className="text-sm text-gray-600">Toplam Adet</p>
                    <p className="font-semibold text-gray-800">
                      {selectedTransaction.transaction.adet} Adet
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Barkod Listesi</p>
                    <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                              Barkod No
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedTransaction.barcodes.map((barcode, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-xs font-mono text-gray-700">
                                {barcode}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedTransaction(null)}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Kapat
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Detay görüntülemek için bir işlemin göz ikonuna tıklayın.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

