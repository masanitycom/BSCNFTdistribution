import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const { data: collections, error } = await supabase
      .from("collections")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "コレクションの取得に失敗しました" },
        { status: 500 }
      );
    }

    // Filter out hidden collections (those with [HIDDEN] in description)
    const visibleCollections = (collections || []).filter(
      collection => !(collection.description && collection.description.includes("[HIDDEN]"))
    );

    return NextResponse.json(visibleCollections);
  } catch (error) {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
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
      return NextResponse.json(
        { error: "コレクションの作成に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json(collection);
  } catch (error) {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}