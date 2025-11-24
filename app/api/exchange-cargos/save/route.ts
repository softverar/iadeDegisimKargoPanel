import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import db, { initDatabase } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Tab ID'yi header'dan al
    const tabId = request.headers.get("x-tab-id");
    const user = await getCurrentUser(tabId || undefined);

    if (!user || user.role !== "kurye") {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim" },
        { status: 403 }
      );
    }

    const { alici_adi, firma, desi } = await request.json();

    if (!alici_adi || !firma || !desi) {
      return NextResponse.json(
        { success: false, error: "Alıcı adı, firma ve desi bilgileri gereklidir" },
        { status: 400 }
      );
    }

    if (typeof desi !== "number" || desi <= 0) {
      return NextResponse.json(
        { success: false, error: "Desi pozitif bir sayı olmalıdır" },
        { status: 400 }
      );
    }

    // Veritabanını başlat (eğer henüz başlatılmadıysa)
    await initDatabase();

    // Değişim kargosunu kaydet
    await db.execute({
      sql: "INSERT INTO exchange_cargos (user_id, alici_adi, firma, desi) VALUES (?, ?, ?, ?)",
      args: [user.id, alici_adi.trim(), firma, desi],
    });

    return NextResponse.json({
      success: true,
      message: "Değişim kargosu başarıyla kaydedildi",
    });
  } catch (error) {
    console.error("Save exchange cargo error:", error);
    return NextResponse.json(
      { success: false, error: "Kayıt sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}

