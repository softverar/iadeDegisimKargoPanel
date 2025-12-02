import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import db, { initDatabase } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Sadece müşteri hizmetleri ve admin durum güncelleyebilir
    if (user.role === "kurye" && user.username !== "müsterihizmetleri@verarkargo.com") {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim" },
        { status: 403 }
      );
    }

    const sorunluKargoId = parseInt(params.id);
    const { durum, aciklama, odeme_aciklamasi } = await request.json();

    if (!durum) {
      return NextResponse.json(
        { success: false, error: "Durum gereklidir" },
        { status: 400 }
      );
    }

    // Durum değişikliği için açıklama zorunlu
    if (aciklama === undefined || aciklama === null || aciklama.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Durum değişikliği için açıklama gereklidir" },
        { status: 400 }
      );
    }

    // Ödendi durumunda ödeme açıklaması zorunlu
    if (durum === "Ödendi" && (!odeme_aciklamasi || odeme_aciklamasi.trim() === "")) {
      return NextResponse.json(
        { success: false, error: "Ödendi durumu için ödeme açıklaması gereklidir" },
        { status: 400 }
      );
    }

    // Veritabanını başlat (eğer henüz başlatılmadıysa)
    await initDatabase();

    // Durumu güncelle
    if (durum === "Ödendi") {
      await db.execute({
        sql: `
          UPDATE sorunlu_kargolar 
          SET durum = ?, odeme_aciklamasi = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        args: [durum, odeme_aciklamasi.trim(), sorunluKargoId],
      });
    } else {
      await db.execute({
        sql: `
          UPDATE sorunlu_kargolar 
          SET durum = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        args: [durum, sorunluKargoId],
      });
    }

    return NextResponse.json({
      success: true,
      message: "Durum başarıyla güncellendi",
    });
  } catch (error) {
    console.error("Update status error:", error);
    return NextResponse.json(
      { success: false, error: "Durum güncelleme sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}

