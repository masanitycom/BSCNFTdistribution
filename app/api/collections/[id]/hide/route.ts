import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    // Check if collection exists
    const { data: collection, error: fetchError } = await supabase
      .from("collections")
      .select("id, name, contract_address, description")
      .eq("id", id)
      .single();

    if (fetchError || !collection) {
      return NextResponse.json(
        { error: "コレクションが見つかりません" },
        { status: 404 }
      );
    }

    // For now, we'll simulate hiding by updating the description to include a hidden marker
    // This is a workaround since we can't modify the database schema
    const { error: updateError } = await supabase
      .from("collections")
      .update({ 
        description: (collection.description || "") + " [HIDDEN]"
      })
      .eq("id", id);

    if (updateError) {
      console.error("Hide error:", updateError);
      return NextResponse.json(
        { error: "コレクションの非表示に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "コレクションを非表示にしました"
    });

  } catch (error) {
    console.error("Hide collection error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}