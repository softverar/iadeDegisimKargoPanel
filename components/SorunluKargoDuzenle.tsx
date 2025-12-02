"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

interface User {
  id: number;
  username: string;
  role: "kurye" | "admin";
  name: string;
}

interface SorunluKargoDuzenleProps {
  user: User;
  sorunluKargoId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const FIRMALAR = [
  "Aras Kargo",
  "PTT",
  "Yurtiçi",
  "Sürat",
  "Kargoist",
  "PTT Kargo",
];

export default function SorunluKargoDuzenle({
  user,
  sorunluKargoId,
  onClose,
  onSuccess,
}: SorunluKargoDuzenleProps) {
  const router = useRouter();
  const [barkodNo, setBarkodNo] = useState("");
  const [cikisNo, setCikisNo] = useState("");
  const [tasiyiciFirma, setTasiyiciFirma] = useState("");
  const [gondericiFirma, setGondericiFirma] = useState("");
  const [aliciAdi, setAliciAdi] = useState("");
  const [aciklama, setAciklama] = useState("");
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
        setBarkodNo(data.sorunluKargo.barkod_no);
        setCikisNo(data.sorunluKargo.cikis_no);
        setTasiyiciFirma(data.sorunluKargo.tasiyici_firma);
        setGondericiFirma(data.sorunluKargo.gonderici_firma);
        setAliciAdi(data.sorunluKargo.alici_adi);
        setAciklama(data.sorunluKargo.aciklama);
      } else {
        setMessage({ type: "error", text: data.error || "Kayıt bulunamadı" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Kayıt yüklenirken bir hata oluştu" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!barkodNo.trim()) {
      setMessage({ type: "error", text: "Lütfen barkod numarasını girin" });
      return;
    }

    if (!cikisNo.trim()) {
      setMessage({ type: "error", text: "Lütfen çıkış numarasını girin" });
      return;
    }

    if (!tasiyiciFirma) {
      setMessage({ type: "error", text: "Lütfen taşıyıcı firmayı seçin" });
      return;
    }

    if (!gondericiFirma.trim()) {
      setMessage({ type: "error", text: "Lütfen gönderici firmayı girin" });
      return;
    }

    if (!aliciAdi.trim()) {
      setMessage({ type: "error", text: "Lütfen alıcı adı soyadını girin" });
      return;
    }

    if (!aciklama.trim()) {
      setMessage({ type: "error", text: "Lütfen açıklama girin" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await apiFetch(`/api/sorunlu-kargolar/${sorunluKargoId}`, {
        method: "PUT",
        body: JSON.stringify({
          barkod_no: barkodNo.trim(),
          cikis_no: cikisNo.trim(),
          tasiyici_firma: tasiyiciFirma,
          gonderici_firma: gondericiFirma.trim(),
          alici_adi: aliciAdi.trim(),
          aciklama: aciklama.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "Kayıt başarıyla güncellendi" });
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
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
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
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Kayıt Düzenle</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taşıyıcı Firma (Kargo Şirketi) *
              </label>
              <select
                value={tasiyiciFirma}
                onChange={(e) => setTasiyiciFirma(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                required
              >
                <option value="">Firma seçiniz</option>
                {FIRMALAR.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gönderici Firma *
              </label>
              <input
                type="text"
                value={gondericiFirma}
                onChange={(e) => setGondericiFirma(e.target.value)}
                placeholder="Firma adı giriniz"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alıcı Adı Soyadı *
              </label>
              <input
                type="text"
                value={aliciAdi}
                onChange={(e) => setAliciAdi(e.target.value)}
                placeholder="Alıcı adı soyadı giriniz"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barkod Numarası *
              </label>
              <input
                type="text"
                value={barkodNo}
                onChange={(e) => setBarkodNo(e.target.value)}
                placeholder="Barkod numarası giriniz"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Çıkış Numarası *
              </label>
              <input
                type="text"
                value={cikisNo}
                onChange={(e) => setCikisNo(e.target.value)}
                placeholder="Çıkış numarası giriniz"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama
            </label>
            <textarea
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              placeholder="Sorun detaylarını açıklayın..."
              rows={4}
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
              {saving ? "Kaydediliyor..." : "Kaydet"}
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

