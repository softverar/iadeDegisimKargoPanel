import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || "",
});

let dbInitialized = false;

// Veritabanı tablolarını oluştur
export async function initDatabase() {
  if (dbInitialized) {
    return;
  }

  try {
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

    // Yeni admin kullanıcıları oluştur (eğer yoksa)
    const adminUsers = [
      { username: "hatipcoskun@verarkargo.com", password: "Ht1903.", name: "Hatip Bey" },
      { username: "müsterihizmetleri@verarkargo.com", password: "müsteri34", name: "Müşteri Hizmetleri" },
    ];

    for (const admin of adminUsers) {
      const adminCheck = await client.execute({
        sql: "SELECT id FROM users WHERE username = ?",
        args: [admin.username],
      });

      if (adminCheck.rows.length === 0) {
        const hashedPassword = await bcrypt.hash(admin.password, 10);
        await client.execute({
          sql: "INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)",
          args: [admin.username, hashedPassword, "admin", admin.name],
        });
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

    dbInitialized = true;
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}

export default client;

