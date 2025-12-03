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
      SELECT DISTINCT
        u.id,
        u.name,
        u.username
      FROM users u
      WHERE u.role = 'kurye'
      ORDER BY u.name ASC
    `);

    const kuryeler = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      username: row.username,
    }));

    return NextResponse.json({ success: true, kuryeler });
  } catch (error) {
    console.error("List kurye error:", error);
    return NextResponse.json(
      { success: false, error: "Liste alınırken bir hata oluştu" },
      { status: 500 }
    );
  }
}

