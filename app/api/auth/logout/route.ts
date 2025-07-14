import { NextResponse } from "next/server";
import { logout } from "@/lib/auth";

export async function POST() {
  try {
    await logout();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "ログアウト処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await logout();
    // GETリクエストの場合はリダイレクト
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "https://bscnf-tdistribution.vercel.app"));
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "https://bscnf-tdistribution.vercel.app"));
  }
}