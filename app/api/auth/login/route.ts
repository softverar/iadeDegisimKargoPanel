import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password, role, tabId } = await request.json();

    if (!username || !password || !role) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı adı, şifre ve rol gereklidir" },
        { status: 400 }
      );
    }

    const result = await login(username, password, role, tabId);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 401 });
    }
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { success: false, error: "Giriş yapılırken bir hata oluştu" },
      { status: 500 }
    );
  }
}
