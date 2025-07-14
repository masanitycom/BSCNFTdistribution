import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    console.log("Collections GET: checking session...");
    const session = await getSession();
    console.log("Collections GET: session result:", !!session);
    
    if (!session) {
      console.log("Collections GET: No session, returning 401");
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const { data: collections, error } = await supabase
      .from("collections")
      .select("*")
      .or("is_hidden.is.null,is_hidden.eq.false")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "コレクションの取得に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json(collections || []);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Collections POST: checking session...");
    const session = await getSession();
    console.log("Collections POST: session result:", !!session);
    
    if (!session) {
      console.log("Collections POST: No session, returning 401");
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const { name, symbol, description } = await request.json();

    if (!name || !symbol) {
      return NextResponse.json(
        { error: "名前とシンボルは必須です" },
        { status: 400 }
      );
    }

    // Check if collection name already exists
    const { data: existingCollection } = await supabase
      .from("collections")
      .select("id")
      .eq("name", name)
      .single();

    if (existingCollection) {
      return NextResponse.json(
        { error: "この名前のコレクションは既に存在します" },
        { status: 400 }
      );
    }

    const { data: collection, error } = await supabase
      .from("collections")
      .insert({
        name,
        symbol: symbol.toUpperCase(),
        description,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "コレクションの作成に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}