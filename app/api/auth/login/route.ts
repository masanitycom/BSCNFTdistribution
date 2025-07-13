import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyPassword, createSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "メールアドレスとパスワードを入力してください" },
        { status: 400 }
      );
    }

    // Check if the email matches the admin email
    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminPasswordHash) {
      console.error("ADMIN_PASSWORD_HASH is not set in environment variables");
      return NextResponse.json(
        { error: "サーバー設定エラー" },
        { status: 500 }
      );
    }

    if (email !== adminEmail) {
      return NextResponse.json(
        { error: "認証に失敗しました" },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, adminPasswordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "認証に失敗しました" },
        { status: 401 }
      );
    }

    // Check if admin user exists in database, create if not
    let { data: adminUser } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .single();

    if (!adminUser) {
      const { data: newUser } = await supabase
        .from("admin_users")
        .insert({
          email,
          password_hash: adminPasswordHash,
        })
        .select()
        .single();
      adminUser = newUser;
    }

    if (!adminUser) {
      return NextResponse.json(
        { error: "ユーザー作成に失敗しました" },
        { status: 500 }
      );
    }

    // Create session
    const token = await createSession(adminUser.id);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "ログイン処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}