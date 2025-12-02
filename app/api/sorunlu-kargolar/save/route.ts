import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import db, { initDatabase } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Tab ID'yi header'dan al
    const tabId = request.headers.get("x-tab-id");
    const user = await getCurrentUser(tabId || undefined);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim" },
        { status: 403 }
      );
    }

    // Sadece müşteri hizmetleri kullanıcısı sorunlu kargo kaydı oluşturabilir
    if (user.username !== "müsterihizmetleri@verarkargo.com") {
      return NextResponse.json(
        { success: false, error: "Sadece müşteri hizmetleri sorunlu kargo kaydı oluşturabilir" },
        { status: 403 }
      );
    }

    const { barkod_no, cikis_no, tasiyici_firma, gonderici_firma, alici_adi, aciklama, fotograflar } = await request.json();

    if (!barkod_no || !cikis_no || !tasiyici_firma || !gonderici_firma || !alici_adi || !aciklama) {
      return NextResponse.json(
        { success: false, error: "Tüm alanlar gereklidir" },
        { status: 400 }
      );
    }

    // Veritabanını başlat (eğer henüz başlatılmadıysa)
    await initDatabase();

    // Transaction başlat
    const transaction = await db.transaction();

    try {
      // Sorunlu kargo kaydı oluştur
      const result = await transaction.execute({
        sql: `
          INSERT INTO sorunlu_kargolar 
          (user_id, barkod_no, cikis_no, tasiyici_firma, gonderici_firma, alici_adi, aciklama) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        args: [user.id, barkod_no.trim(), cikis_no.trim(), tasiyici_firma, gonderici_firma.trim(), alici_adi.trim(), aciklama.trim()],
      });

      const sorunluKargoId = Number(result.lastInsertRowid);

      // Fotoğrafları ekle (eğer varsa)
      if (fotograflar && Array.isArray(fotograflar) && fotograflar.length > 0) {
        for (const foto of fotograflar) {
          // Base64 string veya URL olarak sakla
          if (foto && typeof foto === "string") {
            await transaction.execute({
              sql: "INSERT INTO sorunlu_kargo_fotograflar (sorunlu_kargo_id, foto_url) VALUES (?, ?)",
              args: [sorunluKargoId, foto],
            });
          }
        }
      }

      // Transaction'ı commit et
      await transaction.commit();

      return NextResponse.json({
        success: true,
        message: "Sorunlu kargo kaydı başarıyla oluşturuldu",
        id: sorunluKargoId,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Save sorunlu kargo error:", error);
    return NextResponse.json(
      { success: false, error: "Kayıt sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}

