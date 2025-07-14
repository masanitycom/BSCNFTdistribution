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

    const { nft_id } = await request.json();

    if (!nft_id) {
      return NextResponse.json(
        { error: "NFT IDが必要です" },
        { status: 400 }
      );
    }

    // Delete NFT record from database (blockchain NFT will remain)
    const { error: deleteError } = await supabase
      .from("nfts")
      .delete()
      .eq("collection_id", id)
      .eq("token_id", nft_id);

    if (deleteError) {
      console.error("NFT delete error:", deleteError);
      return NextResponse.json(
        { error: "NFTの削除に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `NFT ID ${nft_id} のデータベース記録を削除しました（ブロックチェーン上のNFTは残ります）`
    });

  } catch (error) {
    console.error("Delete NFT error:", error);
    return NextResponse.json(
      { error: "削除処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}