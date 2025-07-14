import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // Check cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    
    // Check admin_users table
    const { data: adminUsers, error: adminError } = await supabase
      .from("admin_users")
      .select("id, email, created_at")
      .limit(5);
    
    // Check sessions table
    const { data: sessions, error: sessionsError } = await supabase
      .from("sessions")
      .select("id, user_id, token, expires_at, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    
    // If we have a cookie, check if it exists in DB
    let cookieInDb = false;
    if (sessionCookie?.value && sessions) {
      cookieInDb = sessions.some(s => s.token === sessionCookie.value);
    }
    
    return NextResponse.json({
      cookie: {
        exists: !!sessionCookie,
        value: sessionCookie?.value ? `${sessionCookie.value.substring(0, 8)}...` : null,
        inDatabase: cookieInDb
      },
      database: {
        adminUsers: {
          count: adminUsers?.length || 0,
          error: adminError?.message,
          data: adminUsers
        },
        sessions: {
          count: sessions?.length || 0,
          error: sessionsError?.message,
          data: sessions?.map(s => ({
            ...s,
            token: `${s.token.substring(0, 8)}...`
          }))
        }
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}