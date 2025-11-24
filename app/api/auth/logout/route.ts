import { NextRequest, NextResponse } from "next/server";
import { logout } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { tabId } = await request.json().catch(() => ({}));
  logout(tabId);
  return NextResponse.json({ success: true });
}





