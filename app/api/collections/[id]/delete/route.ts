import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function DELETE(
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
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !collection) {
      return NextResponse.json(
        { error: "コレクションが見つかりません" },
        { status: 404 }
      );
    }

    // Check if collection has minted NFTs
    const { data: nfts, error: nftsError } = await supabase
      .from("nfts")
      .select("id")
      .eq("collection_id", id)
      .limit(1);

    if (nftsError) {
      console.error("NFTs check error:", nftsError);
      return NextResponse.json(
        { error: "NFTの確認中にエラーが発生しました" },
        { status: 500 }
      );
    }

    if (nfts && nfts.length > 0) {
      return NextResponse.json(
        { error: "NFTが発行済みのコレクションは削除できません" },
        { status: 400 }
      );
    }

    // Delete related distribution jobs first (cascade should handle this, but being explicit)
    const { error: jobsDeleteError } = await supabase
      .from("distribution_jobs")
      .delete()
      .eq("collection_id", id);

    if (jobsDeleteError) {
      console.error("Distribution jobs delete error:", jobsDeleteError);
      // Continue anyway, as cascade should handle this
    }

    // Delete the collection
    const { error: deleteError } = await supabase
      .from("collections")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Collection delete error:", deleteError);
      return NextResponse.json(
        { error: "コレクションの削除に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "コレクションが削除されました"
    });
  } catch (error) {
    console.error("Delete collection error:", error);
    return NextResponse.json(
      { error: "削除処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}