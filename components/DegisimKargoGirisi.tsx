"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

interface User {
  id: number;
  username: string;
  role: "kurye" | "admin";
  name: string;
}

interface DegisimKargoGirisiProps {
  user: User;
}

const FIRMALAR = [
  "Aras Kargo",
  "PTT",
  "Yurtiçi",
  "Sürat",
  "Kargoist",
];

export default function DegisimKargoGirisi({ user }: DegisimKargoGirisiProps) {
  const router = useRouter();
  const [exchangeAlıcıAdı, setExchangeAlıcıAdı] = useState("");
  const [exchangeFirma, setExchangeFirma] = useState("");
  const [exchangeDesi, setExchangeDesi] = useState("");
  const [exchangeLoading, setExchangeLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleExchangeCargoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!exchangeAlıcıAdı.trim()) {
      setMessage({ type: "error", text: "Lütfen alıcının adını girin" });
      return;
    }

    if (!exchangeFirma) {
      setMessage({ type: "error", text: "Lütfen bir kargo firması seçin" });
      return;
    }

    const desiNumber = parseFloat(exchangeDesi);
    if (!exchangeDesi || isNaN(desiNumber) || desiNumber <= 0) {
      setMessage({ type: "error", text: "Lütfen geçerli bir desi değeri girin" });
      return;
    }

    setExchangeLoading(true);
    setMessage(null);

    try {
      const response = await apiFetch("/api/exchange-cargos/save", {
        method: "POST",
        body: JSON.stringify({
          alici_adi: exchangeAlıcıAdı.trim(),
          firma: exchangeFirma,
          desi: desiNumber,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: "Değişim kargosu başarıyla kaydedildi!",
        });
        setExchangeAlıcıAdı("");
        // Kargo firması seçimi korunuyor - sıfırlanmıyor
        setExchangeDesi("");
      } else {
        setMessage({ type: "error", text: data.error || "Kayıt başarısız" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Bir hata oluştu. Lütfen tekrar deneyin." });
    } finally {
      setExchangeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Değişim Kargo Girişi</h1>
              <p className="text-gray-600 mt-1">Hoş geldiniz, {user.name}</p>
            </div>
            <button
              onClick={() => router.push("/kurye")}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Ana Menü
            </button>
          </div>
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

        {/* Değişim Kargoları Formu */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Değişim Kargoları
          </h2>
          <form onSubmit={handleExchangeCargoSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alıcının Adı Soyadı
              </label>
              <input
                type="text"
                value={exchangeAlıcıAdı}
                onChange={(e) => setExchangeAlıcıAdı(e.target.value)}
                placeholder="Alıcının adı soyadı..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kargo Firması
              </label>
              <select
                value={exchangeFirma}
                onChange={(e) => setExchangeFirma(e.target.value)}
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
                Desi
              </label>
              <input
                type="number"
                value={exchangeDesi}
                onChange={(e) => setExchangeDesi(e.target.value)}
                placeholder="Kaç desi?"
                min="1"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                required
              />
            </div>
            <button
              type="submit"
              disabled={exchangeLoading}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exchangeLoading ? "Kaydediliyor..." : "Değişim Kargosu Kaydet"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

