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

    const transactionId = parseInt(params.id);

    // Veritabanını başlat (eğer henüz başlatılmadıysa)
    await initDatabase();

    // Transaction başlat
    const transaction = await db.transaction();

    try {
      // Önce barkodları sil
      await transaction.execute({
        sql: "DELETE FROM barcodes WHERE transaction_id = ?",
        args: [transactionId],
      });

      // Sonra transaction'ı sil
      await transaction.execute({
        sql: "DELETE FROM transactions WHERE id = ?",
        args: [transactionId],
      });

      // Transaction'ı commit et
      await transaction.commit();

      return NextResponse.json({
        success: true,
        message: "İşlem başarıyla silindi",
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Delete transaction error:", error);
    return NextResponse.json(
      { success: false, error: "Silme işlemi sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}




