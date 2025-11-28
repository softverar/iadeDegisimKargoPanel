"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

interface User {
  id: number;
  username: string;
  role: "kurye" | "admin";
  name: string;
}

interface IadeKargoGirisiProps {
  user: User;
}

const FIRMALAR = [
  "Aras Kargo",
  "PTT",
  "Yurtiçi",
  "Sürat",
  "Kargoist",
];

export default function IadeKargoGirisi({ user }: IadeKargoGirisiProps) {
  const router = useRouter();
  const [firma, setFirma] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodes, setBarcodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const playBeep = () => {
    try {
      // Web Audio API ile yüksek sesli ve baskın bir beep sesi oluştur
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Daha belirgin bir frekans (1000 Hz)
      oscillator.frequency.value = 1000;
      oscillator.type = "square"; // Square wave daha keskin ve belirgin bir ses verir

      // Daha yüksek ses seviyesi (0.8 gain = %80 ses)
      gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2); // Biraz daha uzun süre
    } catch (error) {
      // Ses çalma hatası durumunda sessizce devam et
      console.log("Ses çalınamadı:", error);
    }
  };

  const playErrorBeep = () => {
    try {
      // Web Audio API ile olumsuz/uyarı sesi oluştur (düşük frekanslı, kısa)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Düşük frekans (400 Hz) - olumsuz ses için
      oscillator.frequency.value = 400;
      oscillator.type = "sawtooth"; // Sawtooth wave daha sert bir ses verir

      // Yüksek ses seviyesi ama kısa süre
      gainNode.gain.setValueAtTime(0.7, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch (error) {
      // Ses çalma hatası durumunda sessizce devam et
      console.log("Ses çalınamadı:", error);
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedBarcode = barcodeInput.trim();

    if (!trimmedBarcode) {
      return;
    }

    if (barcodes.includes(trimmedBarcode)) {
      setMessage({ type: "error", text: "Bu barkod zaten eklenmiş" });
      setBarcodeInput("");
      
      // Olumsuz ses çal (hata durumu)
      playErrorBeep();
      
      inputRef.current?.focus();
      return;
    }

    setBarcodes([...barcodes, trimmedBarcode]);
    setBarcodeInput("");
    setMessage(null);
    
    // Barkod başarıyla eklendiğinde bildirim sesi çal
    playBeep();
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  const handleRemoveBarcode = (index: number) => {
    setBarcodes(barcodes.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!firma) {
      setMessage({ type: "error", text: "Lütfen bir firma seçin" });
      return;
    }

    if (barcodes.length === 0) {
      setMessage({ type: "error", text: "En az bir barkod eklemelisiniz" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await apiFetch("/api/barcodes/save", {
        method: "POST",
        body: JSON.stringify({ firma, barcodes }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: `${data.adet} adet barkod başarıyla kaydedildi!`,
        });
        setBarcodes([]);
        setBarcodeInput("");
        inputRef.current?.focus();
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
              <h1 className="text-2xl font-bold text-gray-800">İade Kargo Girişi</h1>
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

        {/* Firma Seçimi */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kargo Firması
          </label>
          <select
            value={firma}
            onChange={(e) => setFirma(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
          >
            <option value="">Firma seçiniz</option>
            {FIRMALAR.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Barkod Okutma */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            İade Barkod Okutma
          </h2>
          <form onSubmit={handleBarcodeSubmit}>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Barkod okutun veya manuel girin..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-gray-900 bg-white"
                autoFocus
              />
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Ekle
              </button>
            </div>
          </form>
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

        {/* Barkod Listesi */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              İade Barkod Listesi ({barcodes.length} adet)
            </h2>
            {barcodes.length > 0 && (
              <button
                onClick={handleSave}
                disabled={loading || !firma}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Kaydediliyor..." : "Kaydet"}
              </button>
            )}
          </div>

          {barcodes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Henüz barkod eklenmedi. Barkod okutun veya manuel girin.
            </p>
          ) : (
            <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
              <ul className="divide-y divide-gray-200">
                {barcodes.map((barcode, index) => (
                  <li
                    key={index}
                    className="px-4 py-3 flex justify-between items-center hover:bg-gray-50"
                  >
                    <span className="font-mono text-sm text-gray-900">{barcode}</span>
                    <button
                      onClick={() => handleRemoveBarcode(index)}
                      className="text-red-600 hover:text-red-800 font-semibold"
                    >
                      Sil
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

