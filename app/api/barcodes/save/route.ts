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

    const { firma, barcodes } = await request.json();

    if (!firma || !barcodes || !Array.isArray(barcodes) || barcodes.length === 0) {
      return NextResponse.json(
        { success: false, error: "Firma ve barkod listesi gereklidir" },
        { status: 400 }
      );
    }

    // Veritabanını başlat (eğer henüz başlatılmadıysa)
    await initDatabase();

    // Transaction başlat
    const transaction = await db.transaction();

    try {
      // Ana kaydı oluştur
      const result = await transaction.execute({
        sql: "INSERT INTO transactions (user_id, firma, adet) VALUES (?, ?, ?)",
        args: [user.id, firma, barcodes.length],
      });

      const transactionId = result.lastInsertRowid as number;

      // Barkodları ekle
      for (const barcode of barcodes) {
        await transaction.execute({
          sql: "INSERT INTO barcodes (transaction_id, barcode) VALUES (?, ?)",
          args: [transactionId, barcode],
        });
      }

      // Transaction'ı commit et
      await transaction.commit();

      return NextResponse.json({
        success: true,
        message: `${barcodes.length} adet barkod başarıyla kaydedildi`,
        adet: barcodes.length,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Save barcodes error:", error);
    return NextResponse.json(
      { success: false, error: "Kayıt sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}

