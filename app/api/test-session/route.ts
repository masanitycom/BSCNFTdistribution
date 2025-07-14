import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    console.log("Testing session and database connection...");
    
    // Test database connection
    const { data: testData, error: testError } = await supabase
      .from("admin_users")
      .select("count")
      .limit(1);
    
    console.log("Database test:", { testData, testError });
    
    // Test session
    const session = await getSession();
    console.log("Session test:", !!session);
    
    return NextResponse.json({
      database: !testError,
      session: !!session,
      environment: {
        supabase_url: !!process.env.SUPABASE_URL,
        supabase_key: !!process.env.SUPABASE_ANON_KEY,
        admin_email: !!process.env.ADMIN_EMAIL,
        admin_hash: !!process.env.ADMIN_PASSWORD_HASH,
      }
    });
  } catch (error) {
    console.error("Test error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}