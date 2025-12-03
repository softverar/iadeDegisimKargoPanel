import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import db, { initDatabase } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Tab ID'yi header'dan al
    const tabId = request.headers.get("x-tab-id");
    const user = await getCurrentUser(tabId || undefined);

    // Admin veya müşteri hizmetleri erişebilir
    if (!user || (user.role !== "admin" && user.username !== "müsterihizmetleri@verarkargo.com")) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim" },
        { status: 403 }
      );
    }

    const transactionId = parseInt(params.id);

    // Veritabanını başlat (eğer henüz başlatılmadıysa)
    await initDatabase();

    // Transaction bilgilerini al
    const transactionResult = await db.execute({
      sql: `
        SELECT 
          t.id,
          t.firma,
          t.adet,
          t.created_at,
          u.name as kurye_name,
          u.username as kurye_username
        FROM transactions t
        INNER JOIN users u ON t.user_id = u.id
        WHERE t.id = ?
      `,
      args: [transactionId],
    });

    if (transactionResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "İşlem bulunamadı" },
        { status: 404 }
      );
    }

    // Barkodları al
    const barcodesResult = await db.execute({
      sql: "SELECT barcode, created_at FROM barcodes WHERE transaction_id = ? ORDER BY created_at",
      args: [transactionId],
    });

    const transaction = transactionResult.rows[0] as any;
    const barcodes = barcodesResult.rows.map((row: any) => row.barcode);

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        firma: transaction.firma,
        adet: transaction.adet,
        created_at: transaction.created_at,
        kurye_name: transaction.kurye_name,
        kurye_username: transaction.kurye_username,
      },
      barcodes,
    });
  } catch (error) {
    console.error("Get transaction detail error:", error);
    return NextResponse.json(
      { success: false, error: "Detay alınırken bir hata oluştu" },
      { status: 500 }
    );
  }
}

