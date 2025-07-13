import { NextRequest, NextResponse } from "next/server";
import { logout } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await logout();
    return NextResponse.redirect(new URL("/login", request.url));
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "ログアウト処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}