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

    const { barcode } = await request.json();

    if (!barcode || typeof barcode !== "string") {
      return NextResponse.json(
        { success: false, error: "Barkod gereklidir" },
        { status: 400 }
      );
    }

    // Veritabanını başlat (eğer henüz başlatılmadıysa)
    await initDatabase();

    // Veritabanında bu barkodun daha önce kaydedilip kaydedilmediğini kontrol et
    const existingBarcode = await db.execute({
      sql: "SELECT id FROM barcodes WHERE barcode = ?",
      args: [barcode.trim()],
    });

    const exists = existingBarcode.rows.length > 0;

    return NextResponse.json({
      success: true,
      exists: exists,
      message: exists ? "Bu barkod daha önce kaydedilmiş" : "Barkod kaydedilebilir",
    });
  } catch (error) {
    console.error("Check barcode error:", error);
    return NextResponse.json(
      { success: false, error: "Kontrol sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}

