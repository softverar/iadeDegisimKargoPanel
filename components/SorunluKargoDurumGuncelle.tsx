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

interface SorunluKargoDurumGuncelleProps {
  user: User;
  sorunluKargoId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const DURUMLAR = ["Yeni Kayıt", "İşlemde", "Çözüldü", "Ödendi", "Reddedildi"];

export default function SorunluKargoDurumGuncelle({
  user,
  sorunluKargoId,
  onClose,
  onSuccess,
}: SorunluKargoDurumGuncelleProps) {
  const router = useRouter();
  const [kargoBilgisi, setKargoBilgisi] = useState<any>(null);
  const [durum, setDurum] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [odemeAciklamasi, setOdemeAciklamasi] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadKargoBilgisi();
  }, [sorunluKargoId]);

  const loadKargoBilgisi = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`/api/sorunlu-kargolar/${sorunluKargoId}`);
      const data = await response.json();

      if (data.success) {
        setKargoBilgisi(data.sorunluKargo);
        setDurum(data.sorunluKargo.durum);
      }
    } catch (error) {
      setMessage({ type: "error", text: "Kayıt yüklenirken bir hata oluştu" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!durum) {
      setMessage({ type: "error", text: "Lütfen durum seçin" });
      return;
    }

    if (!aciklama.trim()) {
      setMessage({ type: "error", text: "Durum değişikliği için açıklama gereklidir" });
      return;
    }

    if (durum === "Ödendi" && !odemeAciklamasi.trim()) {
      setMessage({ type: "error", text: "Ödendi durumu için ödeme açıklaması gereklidir" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await apiFetch(`/api/sorunlu-kargolar/${sorunluKargoId}/status`, {
        method: "PUT",
        body: JSON.stringify({
          durum,
          aciklama: aciklama.trim(),
          odeme_aciklamasi: durum === "Ödendi" ? odemeAciklamasi.trim() : null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "Durum başarıyla güncellendi" });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      } else {
        setMessage({ type: "error", text: data.error || "Güncelleme başarısız" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Bir hata oluştu. Lütfen tekrar deneyin." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Durum Güncelle</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {kargoBilgisi && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Barkod:</strong> {kargoBilgisi.barkod_no} |{" "}
              <strong>Çıkış No:</strong> {kargoBilgisi.cikis_no} |{" "}
              <strong>Firma:</strong> {kargoBilgisi.gonderici_firma}
            </p>
          </div>
        )}

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durum *
            </label>
            <select
              value={durum}
              onChange={(e) => setDurum(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              required
            >
              <option value="">Durum seçiniz</option>
              {DURUMLAR.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {durum === "Ödendi" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ödeme Açıklaması *
              </label>
              <textarea
                value={odemeAciklamasi}
                onChange={(e) => setOdemeAciklamasi(e.target.value)}
                placeholder="Ödeme detaylarını açıklayın (örn: 1000 TL ödendi, banka transferi ile...)"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white resize-y"
                required={durum === "Ödendi"}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama *
            </label>
            <textarea
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              placeholder="Durum değişikliği açıklaması..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white resize-y"
              required
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Güncelleniyor..." : "Durumu Güncelle"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


