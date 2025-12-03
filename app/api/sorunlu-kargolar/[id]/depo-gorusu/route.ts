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

    // Sadece kurye rolündeki kullanıcılar depo görüşü ekleyebilir
    if (!user || user.role !== "kurye") {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim" },
        { status: 403 }
      );
    }

    const sorunluKargoId = parseInt(params.id);
    const { depo_gorusu } = await request.json();

    if (depo_gorusu === undefined || depo_gorusu === null) {
      return NextResponse.json(
        { success: false, error: "Depo görüşü gereklidir" },
        { status: 400 }
      );
    }

    // Veritabanını başlat (eğer henüz başlatılmadıysa)
    await initDatabase();

    // Depo görüşünü güncelle
    await db.execute({
      sql: `
        UPDATE sorunlu_kargolar 
        SET depo_gorusu = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [depo_gorusu.trim(), sorunluKargoId],
    });

    return NextResponse.json({
      success: true,
      message: "Depo görüşü başarıyla güncellendi",
    });
  } catch (error) {
    console.error("Update depo görüşü error:", error);
    return NextResponse.json(
      { success: false, error: "Depo görüşü güncelleme sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}


