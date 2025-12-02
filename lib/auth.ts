import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import db, { initDatabase } from "./db";

export interface User {
  id: number;
  username: string;
  role: "kurye" | "admin";
  name: string;
}

export async function login(
  username: string,
  password: string,
  role: "kurye" | "admin",
  tabId?: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // Veritabanını başlat (eğer henüz başlatılmadıysa)
    await initDatabase();

    // Debug: Tüm kullanıcıları listele
    const allUsers = await db.execute("SELECT id, username, role, name FROM users");
    console.log("Tüm kullanıcılar:", allUsers.rows);

    const result = await db.execute({
      sql: "SELECT * FROM users WHERE username = ? AND role = ?",
      args: [username, role],
    });

    console.log("Aranan kullanıcı:", { username, role });
    console.log("Bulunan kullanıcı sayısı:", result.rows.length);

    if (result.rows.length === 0) {
      // Kullanıcı yoksa, belki username'de farklılık var, sadece username ile dene
      const resultByUsername = await db.execute({
        sql: "SELECT * FROM users WHERE username = ?",
        args: [username],
      });
      
      if (resultByUsername.rows.length > 0) {
        const foundUser = resultByUsername.rows[0] as any;
        console.log("Kullanıcı bulundu ama rol uyuşmuyor:", { 
          arananRol: role, 
          kullaniciRolu: foundUser.role 
        });
        return { 
          success: false, 
          error: `Kullanıcı bulundu ama rol uyuşmuyor. Kullanıcının rolü: ${foundUser.role}, aranan rol: ${role}` 
        };
      }
      
      return { success: false, error: "Kullanıcı bulunamadı" };
    }

    const user = result.rows[0] as any;
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return { success: false, error: "Şifre hatalı" };
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || "secret-key",
      { expiresIn: "7d" }
    );

    // Tab ID varsa cookie adına ekle, yoksa normal cookie kullan
    const cookieName = tabId ? `auth-token-${tabId}` : "auth-token";
    
    cookies().set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 gün
    });

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Giriş yapılırken bir hata oluştu" 
    };
  }
}

export async function getCurrentUser(tabId?: string): Promise<User | null> {
  try {
    // Tab ID varsa o cookie'yi kontrol et, yoksa normal cookie'yi kontrol et
    const cookieName = tabId ? `auth-token-${tabId}` : "auth-token";
    const token = cookies().get(cookieName)?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret-key"
    ) as any;

    const result = await db.execute({
      sql: "SELECT id, username, role, name FROM users WHERE id = ?",
      args: [decoded.id],
    });

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0] as any;
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    };
  } catch (error) {
    return null;
  }
}

export function logout(tabId?: string) {
  if (tabId) {
    cookies().delete(`auth-token-${tabId}`);
  } else {
    cookies().delete("auth-token");
  }
}

