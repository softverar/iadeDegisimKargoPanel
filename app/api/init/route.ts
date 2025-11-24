import { NextResponse } from "next/server";
import { initDatabase } from "@/lib/db";

export async function GET() {
  try {
    await initDatabase();
    return NextResponse.json({
      success: true,
      message: "Veritabanı başarıyla başlatıldı",
    });
  } catch (error) {
    console.error("Init error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Veritabanı başlatılırken bir hata oluştu",
      },
      { status: 500 }
    );
  }
}








