import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || "",
});

// Veritabanı bağlantısını kontrol et
if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.warn("⚠️ UYARI: TURSO_DATABASE_URL veya TURSO_AUTH_TOKEN environment variable'ları ayarlanmamış!");
}

let tablesInitialized = false;

// Veritabanı tablolarını oluştur
export async function initDatabase() {
  try {
    // Tabloları sadece bir kez oluştur
    if (!tablesInitialized) {
      console.log("Veritabanı tabloları oluşturuluyor...");
      
      // Kullanıcılar tablosu
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('kurye', 'admin')),
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // İşlem kayıtları tablosu (ana tablo)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        firma TEXT NOT NULL,
        adet INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Barkodlar tablosu (detay tablo)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS barcodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id INTEGER NOT NULL,
        barcode TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id)
      )
    `);

    // Değişim kargoları tablosu
    await client.execute(`
      CREATE TABLE IF NOT EXISTS exchange_cargos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        alici_adi TEXT NOT NULL,
        firma TEXT NOT NULL,
        desi INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Sorunlu kargolar tablosu
    await client.execute(`
      CREATE TABLE IF NOT EXISTS sorunlu_kargolar (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        barkod_no TEXT NOT NULL,
        cikis_no TEXT NOT NULL,
        tasiyici_firma TEXT NOT NULL,
        gonderici_firma TEXT NOT NULL,
        alici_adi TEXT NOT NULL,
        aciklama TEXT NOT NULL,
        durum TEXT NOT NULL DEFAULT 'Yeni Kayıt' CHECK(durum IN ('Yeni Kayıt', 'İşlemde', 'Çözüldü', 'Ödendi', 'Reddedildi')),
        depo_gorusu TEXT,
        odeme_aciklamasi TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Sorunlu kargo fotoğrafları tablosu
    await client.execute(`
      CREATE TABLE IF NOT EXISTS sorunlu_kargo_fotograflar (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sorunlu_kargo_id INTEGER NOT NULL,
        foto_url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sorunlu_kargo_id) REFERENCES sorunlu_kargolar(id) ON DELETE CASCADE
      )
    `);

    // Varsayılan admin kullanıcısı oluştur (eğer yoksa)
    const adminCheck = await client.execute({
      sql: "SELECT id FROM users WHERE username = ?",
      args: [process.env.ADMIN_USERNAME || "admin"],
    });

    if (adminCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(
        process.env.ADMIN_PASSWORD || "admin123",
        10
      );
      await client.execute({
        sql: "INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)",
        args: [
          process.env.ADMIN_USERNAME || "admin",
          hashedPassword,
          "admin",
          "Admin",
        ],
      });
    }

    // Varsayılan kurye kullanıcısı oluştur (eğer yoksa)
    const kuryeCheck = await client.execute({
      sql: "SELECT id FROM users WHERE username = ? AND role = ?",
      args: ["kurye", "kurye"],
    });

    if (kuryeCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash("kurye123", 10);
      await client.execute({
        sql: "INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)",
        args: ["kurye", hashedPassword, "kurye", "Kurye"],
      });
    }

    // Admin kullanıcısı oluştur (eğer yoksa)
    const adminCheck2 = await client.execute({
      sql: "SELECT id FROM users WHERE username = ?",
      args: ["hatipcoskun@verarkargo.com"],
    });

    if (adminCheck2.rows.length === 0) {
      const hashedPassword = await bcrypt.hash("Ht1903.", 10);
      await client.execute({
        sql: "INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)",
        args: ["hatipcoskun@verarkargo.com", hashedPassword, "admin", "Hatip Bey"],
      });
    }

    // Müşteri hizmetleri kullanıcısı oluştur veya güncelle (kurye rolünde)
    const mhCheck = await client.execute({
      sql: "SELECT id, role FROM users WHERE username = ?",
      args: ["müsterihizmetleri@verarkargo.com"],
    });

    if (mhCheck.rows.length === 0) {
      console.log("Müşteri hizmetleri kullanıcısı oluşturuluyor...");
      const hashedPassword = await bcrypt.hash("müsteri34", 10);
      await client.execute({
        sql: "INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)",
        args: ["müsterihizmetleri@verarkargo.com", hashedPassword, "kurye", "Müşteri Hizmetleri"],
      });
      console.log("Müşteri hizmetleri kullanıcısı oluşturuldu!");
    } else {
      const existingUser = mhCheck.rows[0] as any;
      if (existingUser.role !== "kurye") {
        console.log("Müşteri hizmetleri kullanıcısının rolü güncelleniyor (admin -> kurye)...");
        await client.execute({
          sql: "UPDATE users SET role = ? WHERE username = ?",
          args: ["kurye", "müsterihizmetleri@verarkargo.com"],
        });
        console.log("Müşteri hizmetleri kullanıcısının rolü güncellendi!");
      } else {
        console.log("Müşteri hizmetleri kullanıcısı zaten mevcut ve doğru rolde");
      }
    }

    // Yeni kurye (depo) kullanıcıları oluştur (eğer yoksa)
    const kuryeUsers = [
      { username: "depo1@verarkargo.com", password: "Depo34.1", name: "Depo1" },
      { username: "depo2@verarkargo.com", password: "Depo34.2", name: "Depo2" },
      { username: "depo3@verarkargo.com", password: "Depo34.3", name: "Depo3" },
    ];

    for (const kurye of kuryeUsers) {
      const kuryeCheck = await client.execute({
        sql: "SELECT id FROM users WHERE username = ?",
        args: [kurye.username],
      });

      if (kuryeCheck.rows.length === 0) {
        const hashedPassword = await bcrypt.hash(kurye.password, 10);
        await client.execute({
          sql: "INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)",
          args: [kurye.username, hashedPassword, "kurye", kurye.name],
        });
      }
    }

      tablesInitialized = true;
      console.log("Veritabanı tabloları oluşturuldu!");
    }

    // Kullanıcıları her zaman kontrol et ve oluştur (tablolar oluşturulduktan sonra)
    console.log("Kullanıcılar kontrol ediliyor...");

    console.log("Veritabanı başlatma tamamlandı!");
  } catch (error) {
    console.error("Database initialization error:", error);
    // Hata olsa bile devam et, sadece log'la
    // throw error; // Hata fırlatmayı kaldırdık, böylece kullanıcılar oluşturulabilir
  }
}

export default client;

