import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log("Debug login attempt:", {
      email,
      passwordLength: password?.length,
      adminEmail: process.env.ADMIN_EMAIL,
      adminHashExists: !!process.env.ADMIN_PASSWORD_HASH,
      emailMatch: email === process.env.ADMIN_EMAIL
    });

    // Check database connection
    const { data: testQuery, error: testError } = await supabase
      .from("admin_users")
      .select("email")
      .limit(1);
    
    console.log("Database test:", { success: !testError, error: testError });

    return NextResponse.json({
      success: true,
      debug: {
        emailProvided: !!email,
        passwordProvided: !!password,
        adminEmailSet: !!process.env.ADMIN_EMAIL,
        adminHashSet: !!process.env.ADMIN_PASSWORD_HASH,
        emailMatch: email === process.env.ADMIN_EMAIL,
        databaseConnected: !testError
      }
    });
  } catch (error) {
    console.error("Debug login error:", error);
    return NextResponse.json({ error: "Debug failed" }, { status: 500 });
  }
}