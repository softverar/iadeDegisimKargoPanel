import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import db, { initDatabase } from "@/lib/db";

export async function GET(request: NextRequest) {
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

    // Veritabanını başlat (eğer henüz başlatılmadıysa)
    await initDatabase();

    // Barkod arama parametresini al
    const { searchParams } = new URL(request.url);
    const barcodeSearch = searchParams.get("barcode");

    let result;
    if (barcodeSearch && barcodeSearch.trim() !== "") {
      // Barkod ile arama yap
      result = await db.execute({
        sql: `
          SELECT DISTINCT
            t.id,
            t.firma,
            t.adet,
            t.created_at,
            u.name as kurye_name,
            u.username as kurye_username
          FROM transactions t
          INNER JOIN users u ON t.user_id = u.id
          INNER JOIN barcodes b ON t.id = b.transaction_id
          WHERE b.barcode LIKE ?
          ORDER BY t.created_at DESC
        `,
        args: [`%${barcodeSearch.trim()}%`],
      });
    } else {
      // Tüm transaction'ları getir
      result = await db.execute(`
        SELECT 
          t.id,
          t.firma,
          t.adet,
          t.created_at,
          u.name as kurye_name,
          u.username as kurye_username
        FROM transactions t
        INNER JOIN users u ON t.user_id = u.id
        ORDER BY t.created_at DESC
      `);
    }

    const transactions = result.rows.map((row: any) => ({
      id: row.id,
      firma: row.firma,
      adet: row.adet,
      created_at: row.created_at,
      kurye_name: row.kurye_name,
      kurye_username: row.kurye_username,
    }));

    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    console.error("List transactions error:", error);
    return NextResponse.json(
      { success: false, error: "Liste alınırken bir hata oluştu" },
      { status: 500 }
    );
  }
}

