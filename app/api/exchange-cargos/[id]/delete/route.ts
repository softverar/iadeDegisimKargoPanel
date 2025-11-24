import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import db, { initDatabase } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Tab ID'yi header'dan al
    const tabId = request.headers.get("x-tab-id");
    const user = await getCurrentUser(tabId || undefined);

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim" },
        { status: 403 }
      );
    }

    const exchangeCargoId = parseInt(params.id);

    // Veritabanını başlat (eğer henüz başlatılmadıysa)
    await initDatabase();

    // Değişim kargosunu sil
    await db.execute({
      sql: "DELETE FROM exchange_cargos WHERE id = ?",
      args: [exchangeCargoId],
    });

    return NextResponse.json({
      success: true,
      message: "Değişim kargosu başarıyla silindi",
    });
  } catch (error) {
    console.error("Delete exchange cargo error:", error);
    return NextResponse.json(
      { success: false, error: "Silme işlemi sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}




