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

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim" },
        { status: 403 }
      );
    }

    const sorunluKargoId = parseInt(params.id);

    // Veritabanını başlat (eğer henüz başlatılmadıysa)
    await initDatabase();

    // Sorunlu kargo bilgilerini al
    const result = await db.execute({
      sql: `
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
          u.username as kullanici_username
        FROM sorunlu_kargolar sk
        INNER JOIN users u ON sk.user_id = u.id
        WHERE sk.id = ?
      `,
      args: [sorunluKargoId],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Kayıt bulunamadı" },
        { status: 404 }
      );
    }

    // Depo kullanıcıları (müşteri hizmetleri hariç) tüm kayıtları görebilir (sadece depo görüşü ekleyebilir)
    // Müşteri hizmetleri ve admin tüm kayıtları görebilir
    const kayit = result.rows[0] as any;
    const isMusteriHizmetleri = user.username === "müsterihizmetleri@verarkargo.com";
    
    // Eski kurye kontrolü kaldırıldı - artık tüm kurye kullanıcıları (depo dahil) tüm kayıtları görebilir

    // Fotoğrafları al
    const fotograflarResult = await db.execute({
      sql: "SELECT id, foto_url, created_at FROM sorunlu_kargo_fotograflar WHERE sorunlu_kargo_id = ? ORDER BY created_at",
      args: [sorunluKargoId],
    });

    const fotograflar = fotograflarResult.rows.map((row: any) => ({
      id: row.id,
      foto_url: row.foto_url,
      created_at: row.created_at,
    }));

    return NextResponse.json({
      success: true,
      sorunluKargo: {
        id: kayit.id,
        barkod_no: kayit.barkod_no,
        cikis_no: kayit.cikis_no,
        tasiyici_firma: kayit.tasiyici_firma,
        gonderici_firma: kayit.gonderici_firma,
        alici_adi: kayit.alici_adi,
        aciklama: kayit.aciklama,
        durum: kayit.durum,
        depo_gorusu: kayit.depo_gorusu,
        odeme_aciklamasi: kayit.odeme_aciklamasi,
        created_at: kayit.created_at,
        updated_at: kayit.updated_at,
        kullanici_name: kayit.kullanici_name,
        kullanici_username: kayit.kullanici_username,
      },
      fotograflar,
    });
  } catch (error) {
    console.error("Get sorunlu kargo error:", error);
    return NextResponse.json(
      { success: false, error: "Kayıt alınırken bir hata oluştu" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const sorunluKargoId = parseInt(params.id);
    const { barkod_no, cikis_no, tasiyici_firma, gonderici_firma, alici_adi, aciklama } = await request.json();

    if (!barkod_no || !cikis_no || !tasiyici_firma || !gonderici_firma || !alici_adi || !aciklama) {
      return NextResponse.json(
        { success: false, error: "Tüm alanlar gereklidir" },
        { status: 400 }
      );
    }

    // Veritabanını başlat (eğer henüz başlatılmadıysa)
    await initDatabase();

    // Kayıt sahibi kontrolü (sadece müşteri hizmetleri veya admin düzenleyebilir)
    const kayitCheck = await db.execute({
      sql: "SELECT user_id FROM sorunlu_kargolar WHERE id = ?",
      args: [sorunluKargoId],
    });

    if (kayitCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Kayıt bulunamadı" },
        { status: 404 }
      );
    }

    const kayit = kayitCheck.rows[0] as any;
    // Sadece müşteri hizmetleri kendi kayıtlarını, admin ise tüm kayıtları düzenleyebilir
    if (user.role === "kurye") {
      if (user.username !== "müsterihizmetleri@verarkargo.com") {
        return NextResponse.json(
          { success: false, error: "Yetkisiz erişim" },
          { status: 403 }
        );
      }
      if (kayit.user_id !== user.id) {
        return NextResponse.json(
          { success: false, error: "Sadece kendi kayıtlarınızı düzenleyebilirsiniz" },
          { status: 403 }
        );
      }
    }

    // Kaydı güncelle
    await db.execute({
      sql: `
        UPDATE sorunlu_kargolar 
        SET barkod_no = ?, cikis_no = ?, tasiyici_firma = ?, gonderici_firma = ?, 
            alici_adi = ?, aciklama = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [barkod_no.trim(), cikis_no.trim(), tasiyici_firma, gonderici_firma.trim(), alici_adi.trim(), aciklama.trim(), sorunluKargoId],
    });

    return NextResponse.json({
      success: true,
      message: "Kayıt başarıyla güncellendi",
    });
  } catch (error) {
    console.error("Update sorunlu kargo error:", error);
    return NextResponse.json(
      { success: false, error: "Güncelleme sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const sorunluKargoId = parseInt(params.id);

    // Veritabanını başlat (eğer henüz başlatılmadıysa)
    await initDatabase();

    // Kayıt sahibi kontrolü (müşteri hizmetleri sadece kendi kayıtlarını, admin tüm kayıtları silebilir)
    const kayitCheck = await db.execute({
      sql: "SELECT user_id FROM sorunlu_kargolar WHERE id = ?",
      args: [sorunluKargoId],
    });

    if (kayitCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Kayıt bulunamadı" },
        { status: 404 }
      );
    }

    const kayit = kayitCheck.rows[0] as any;
    const isMusteriHizmetleri = user.username === "müsterihizmetleri@verarkargo.com";
    
    // Admin tüm kayıtları silebilir, müşteri hizmetleri sadece kendi kayıtlarını silebilir
    if (user.role === "kurye") {
      if (!isMusteriHizmetleri) {
        return NextResponse.json(
          { success: false, error: "Yetkisiz erişim" },
          { status: 403 }
        );
      }
      if (kayit.user_id !== user.id) {
        return NextResponse.json(
          { success: false, error: "Sadece kendi kayıtlarınızı silebilirsiniz" },
          { status: 403 }
        );
      }
    }

    // Transaction başlat
    const transaction = await db.transaction();

    try {
      // Önce fotoğrafları sil (CASCADE ile otomatik silinir ama manuel de yapabiliriz)
      await transaction.execute({
        sql: "DELETE FROM sorunlu_kargo_fotograflar WHERE sorunlu_kargo_id = ?",
        args: [sorunluKargoId],
      });

      // Sonra sorunlu kargo kaydını sil
      await transaction.execute({
        sql: "DELETE FROM sorunlu_kargolar WHERE id = ?",
        args: [sorunluKargoId],
      });

      // Transaction'ı commit et
      await transaction.commit();

      return NextResponse.json({
        success: true,
        message: "Kayıt başarıyla silindi",
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Delete sorunlu kargo error:", error);
    return NextResponse.json(
      { success: false, error: "Silme sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}

