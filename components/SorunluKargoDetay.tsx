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

interface SorunluKargoDetayProps {
  user: User;
  sorunluKargoId: number;
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
  depo_gorusu: string | null;
  odeme_aciklamasi: string | null;
  created_at: string;
  updated_at: string;
  kullanici_name: string;
  kullanici_username: string;
}

interface Foto {
  id: number;
  foto_url: string;
  created_at: string;
}

export default function SorunluKargoDetay({ user, sorunluKargoId }: SorunluKargoDetayProps) {
  const router = useRouter();
  const [sorunluKargo, setSorunluKargo] = useState<SorunluKargo | null>(null);
  const [fotograflar, setFotograflar] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(true);
  const [depoGorusu, setDepoGorusu] = useState("");
  const [savingDepoGorusu, setSavingDepoGorusu] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedFoto, setSelectedFoto] = useState<string | null>(null);
  
  // Depo kullanıcısı mı kontrolü (müşteri hizmetleri değil)
  const isDepoUser = user.role === "kurye" && user.username !== "müsterihizmetleri@verarkargo.com";

  useEffect(() => {
    loadDetay();
  }, [sorunluKargoId]);

  const loadDetay = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`/api/sorunlu-kargolar/${sorunluKargoId}`);
      const data = await response.json();

      if (data.success) {
        setSorunluKargo(data.sorunluKargo);
        setFotograflar(data.fotograflar || []);
        setDepoGorusu(data.sorunluKargo.depo_gorusu || "");
      } else {
        setMessage({ type: "error", text: data.error || "Kayıt bulunamadı" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Kayıt yüklenirken bir hata oluştu" });
    } finally {
      setLoading(false);
    }
  };

  const handleDepoGorusuSave = async () => {
    if (!depoGorusu.trim()) {
      setMessage({ type: "error", text: "Lütfen depo görüşü girin" });
      return;
    }

    setSavingDepoGorusu(true);
    setMessage(null);

    try {
      const response = await apiFetch(`/api/sorunlu-kargolar/${sorunluKargoId}/depo-gorusu`, {
        method: "PUT",
        body: JSON.stringify({ depo_gorusu: depoGorusu }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "Depo görüşü başarıyla kaydedildi" });
        await loadDetay();
      } else {
        setMessage({ type: "error", text: data.error || "Kayıt başarısız" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Bir hata oluştu. Lütfen tekrar deneyin." });
    } finally {
      setSavingDepoGorusu(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("tr-TR", {
      timeZone: "Europe/Istanbul",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!sorunluKargo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-gray-600">Kayıt bulunamadı</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Geri
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Kayıt Detayı</h1>
          </div>
          <p className="text-gray-600">Barkod: {sorunluKargo.barkod_no}</p>
        </div>

        {/* Mesaj */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Kargo Bilgileri */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Kargo Bilgileri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">📦</span>
              <div>
                <p className="text-sm text-gray-600">Barkod Numarası</p>
                <p className="font-semibold text-gray-800">{sorunluKargo.barkod_no}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">📋</span>
              <div>
                <p className="text-sm text-gray-600">Çıkış Numarası</p>
                <p className="font-semibold text-gray-800">{sorunluKargo.cikis_no}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">🚚</span>
              <div>
                <p className="text-sm text-gray-600">Taşıyıcı Firma</p>
                <p className="font-semibold text-gray-800">{sorunluKargo.tasiyici_firma}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">🏢</span>
              <div>
                <p className="text-sm text-gray-600">Gönderici Firma</p>
                <p className="font-semibold text-gray-800">{sorunluKargo.gonderici_firma}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">👤</span>
              <div>
                <p className="text-sm text-gray-600">Alıcı Adı Soyadı</p>
                <p className="font-semibold text-gray-800">{sorunluKargo.alici_adi}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">👤</span>
              <div>
                <p className="text-sm text-gray-600">Kaydı Oluşturan</p>
                <p className="font-semibold text-gray-800">{sorunluKargo.kullanici_name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Açıklama */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Açıklama</h2>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                sorunluKargo.durum === "Yeni Kayıt"
                  ? "bg-orange-100 text-orange-800"
                  : sorunluKargo.durum === "İşlemde"
                  ? "bg-blue-100 text-blue-800"
                  : sorunluKargo.durum === "Çözüldü"
                  ? "bg-green-100 text-green-800"
                  : sorunluKargo.durum === "Ödendi"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {sorunluKargo.durum}
            </span>
          </div>
          <p className="text-gray-700 whitespace-pre-wrap">{sorunluKargo.aciklama}</p>
        </div>

        {/* Fotoğraflar */}
        {fotograflar.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Fotoğraflar ({fotograflar.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {fotograflar.map((foto) => (
                <div
                  key={foto.id}
                  className="relative group cursor-pointer"
                  onClick={() => setSelectedFoto(foto.foto_url)}
                >
                  <img
                    src={foto.foto_url}
                    alt={`Fotoğraf ${foto.id}`}
                    className="w-full h-48 object-cover rounded-lg transition-opacity group-hover:opacity-80"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all duration-200 flex items-center justify-center">
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-3 shadow-lg hover:scale-110 transform transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFoto(foto.foto_url);
                      }}
                      title="Büyüt"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-gray-800"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fotoğraf Büyütme Modal */}
        {selectedFoto && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedFoto(null)}
          >
            <div className="relative max-w-7xl max-h-full">
              <button
                onClick={() => setSelectedFoto(null)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 text-4xl font-bold"
                title="Kapat"
              >
                ×
              </button>
              <img
                src={selectedFoto}
                alt="Büyütülmüş fotoğraf"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}

        {/* Depo Görüşü */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Depo Görüşü</h2>
          {isDepoUser ? (
            <div>
              <textarea
                value={depoGorusu}
                onChange={(e) => setDepoGorusu(e.target.value)}
                placeholder="Kargonun durumunu yazın..."
                rows={4}
                className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white resize-y mb-4"
              />
              <button
                onClick={handleDepoGorusuSave}
                disabled={savingDepoGorusu}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                💾 Kaydet
              </button>
            </div>
          ) : (
            <div>
              {sorunluKargo.depo_gorusu ? (
                <p className="text-gray-700 whitespace-pre-wrap">{sorunluKargo.depo_gorusu}</p>
              ) : (
                <p className="text-gray-500 italic">Henüz depo görüşü eklenmemiş.</p>
              )}
            </div>
          )}
        </div>

        {/* Ödeme Açıklaması */}
        {sorunluKargo.durum === "Ödendi" && sorunluKargo.odeme_aciklamasi && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Ödeme Açıklaması</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{sorunluKargo.odeme_aciklamasi}</p>
          </div>
        )}

        {/* Tarih Bilgileri */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <span>📅</span>
            <span>Oluşturulma Tarihi: {formatDate(sorunluKargo.created_at)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>📅</span>
            <span>Son Güncelleme: {formatDate(sorunluKargo.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

