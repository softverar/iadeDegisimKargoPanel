"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

interface User {
  id: number;
  username: string;
  role: "kurye" | "admin";
  name: string;
}

interface SorunluKargoGirisiProps {
  user: User;
}

const FIRMALAR = [
  "Aras Kargo",
  "PTT",
  "Yurtiçi",
  "Sürat",
  "Kargoist",
  "PTT Kargo",
];

export default function SorunluKargoGirisi({ user }: SorunluKargoGirisiProps) {
  const router = useRouter();
  const [barkodNo, setBarkodNo] = useState("");
  const [cikisNo, setCikisNo] = useState("");
  const [tasiyiciFirma, setTasiyiciFirma] = useState("");
  const [gondericiFirma, setGondericiFirma] = useState("");
  const [aliciAdi, setAliciAdi] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [fotograflar, setFotograflar] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFotograflar: string[] = [];
    const fileArray = Array.from(files);

    fileArray.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          newFotograflar.push(base64);
          if (newFotograflar.length === fileArray.length) {
            setFotograflar([...fotograflar, ...newFotograflar]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleRemoveFoto = (index: number) => {
    setFotograflar(fotograflar.filter((_, i) => i !== index));
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

    setLoading(true);
    setMessage(null);

    try {
      const response = await apiFetch("/api/sorunlu-kargolar/save", {
        method: "POST",
        body: JSON.stringify({
          barkod_no: barkodNo.trim(),
          cikis_no: cikisNo.trim(),
          tasiyici_firma: tasiyiciFirma,
          gonderici_firma: gondericiFirma.trim(),
          alici_adi: aliciAdi.trim(),
          aciklama: aciklama.trim(),
          fotograflar: fotograflar,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: "Sorunlu kargo kaydı başarıyla oluşturuldu!",
        });
        // Formu temizle
        setBarkodNo("");
        setCikisNo("");
        setTasiyiciFirma("");
        setGondericiFirma("");
        setAliciAdi("");
        setAciklama("");
        setFotograflar([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Liste sayfasına yönlendir
        setTimeout(() => {
          router.push("/kurye/sorunlu/liste");
        }, 1500);
      } else {
        setMessage({ type: "error", text: data.error || "Kayıt başarısız" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Bir hata oluştu. Lütfen tekrar deneyin." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Sorunlu Kargo Girişi</h1>
              <p className="text-gray-600 mt-1">Hoş geldiniz, {user.name}</p>
            </div>
            <button
              onClick={() => router.push("/kurye/sorunlu/liste")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Kayıtlarım
            </button>
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

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Yeni Sorunlu Kargo Kaydı
          </h2>
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
                Açıklama *
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fotoğraf Ekle
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="text-4xl mb-2">📷</div>
                <p className="text-gray-600">
                  Fotoğraf yüklemek için tıklayın veya sürükleyin
                </p>
              </div>

              {fotograflar.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {fotograflar.map((foto, index) => (
                    <div key={index} className="relative">
                      <img
                        src={foto}
                        alt={`Fotoğraf ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFoto(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Kaydediliyor..." : "Kaydet"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/kurye")}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

