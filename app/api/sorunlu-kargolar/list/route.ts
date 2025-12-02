import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import db, { initDatabase } from "@/lib/db";

export async function GET(request: NextRequest) {
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

    // Veritabanını başlat (eğer henüz başlatılmadıysa)
    await initDatabase();

    // Admin, müşteri hizmetleri ve depo kullanıcıları tüm kayıtları görebilir
    // (Depo sadece görüntüleme ve depo görüşü ekleme yapabilir)
    let result;
    result = await db.execute(`
      SELECT 
        sk.id,
        sk.barkod_no,
        sk.cikis_no,
        sk.tasiyici_firma,
        sk.gonderici_firma,
        sk.alici_adi,
        sk.aciklama,
        sk.durum,
        sk.depo_gorusu,
        sk.odeme_aciklamasi,
        sk.created_at,
        sk.updated_at,
        u.name as kullanici_name,
        u.username as kullanici_username,
        (SELECT COUNT(*) FROM sorunlu_kargo_fotograflar WHERE sorunlu_kargo_id = sk.id) as foto_sayisi
      FROM sorunlu_kargolar sk
      INNER JOIN users u ON sk.user_id = u.id
      ORDER BY sk.created_at DESC
    `);

    const sorunluKargolar = result.rows.map((row: any) => ({
      id: row.id,
      barkod_no: row.barkod_no,
      cikis_no: row.cikis_no,
      tasiyici_firma: row.tasiyici_firma,
      gonderici_firma: row.gonderici_firma,
      alici_adi: row.alici_adi,
      aciklama: row.aciklama,
      durum: row.durum,
      depo_gorusu: row.depo_gorusu,
      odeme_aciklamasi: row.odeme_aciklamasi,
      created_at: row.created_at,
      updated_at: row.updated_at,
      kullanici_name: row.kullanici_name,
      kullanici_username: row.kullanici_username,
      foto_sayisi: row.foto_sayisi || 0,
    }));

    return NextResponse.json({ success: true, sorunluKargolar });
  } catch (error) {
    console.error("List sorunlu kargolar error:", error);
    return NextResponse.json(
      { success: false, error: "Liste alınırken bir hata oluştu" },
      { status: 500 }
    );
  }
}

