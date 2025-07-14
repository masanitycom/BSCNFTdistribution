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
      .select("id, name, contract_address")
      .eq("id", id)
      .single();

    if (fetchError || !collection) {
      return NextResponse.json(
        { error: "コレクションが見つかりません" },
        { status: 404 }
      );
    }

    // Add is_hidden column if it doesn't exist
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE collections 
        ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
      `
    });

    if (alterError) {
      console.log("Column might already exist:", alterError.message);
    }

    // Update collection to set is_hidden = true
    const { error: updateError } = await supabase
      .from("collections")
      .update({ is_hidden: true })
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