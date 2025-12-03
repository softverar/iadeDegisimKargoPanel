import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import db, { initDatabase } from "@/lib/db";

export async function GET(request: NextRequest) {
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

    // Veritabanını başlat (eğer henüz başlatılmadıysa)
    await initDatabase();

    const result = await db.execute(`
      SELECT 
        ec.id,
        ec.alici_adi,
        ec.firma,
        ec.desi,
        ec.created_at,
        u.name as kurye_name,
        u.username as kurye_username
      FROM exchange_cargos ec
      INNER JOIN users u ON ec.user_id = u.id
      ORDER BY ec.created_at DESC
    `);

    const exchangeCargos = result.rows.map((row: any) => ({
      id: row.id,
      alici_adi: row.alici_adi,
      firma: row.firma,
      desi: row.desi,
      created_at: row.created_at,
      kurye_name: row.kurye_name,
      kurye_username: row.kurye_username,
    }));

    return NextResponse.json({ success: true, exchangeCargos });
  } catch (error) {
    console.error("List exchange cargos error:", error);
    return NextResponse.json(
      { success: false, error: "Liste alınırken bir hata oluştu" },
      { status: 500 }
    );
  }
}

