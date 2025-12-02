import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password, role, tabId } = await request.json();

    console.log("Login attempt:", { username, role, hasPassword: !!password });

    if (!username || !password || !role) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı adı, şifre ve rol gereklidir" },
        { status: 400 }
      );
    }

    const result = await login(username, password, role, tabId);

    console.log("Login result:", { success: result.success, error: result.error });

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
