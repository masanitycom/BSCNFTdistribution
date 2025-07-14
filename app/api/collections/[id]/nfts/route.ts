import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(
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

    // Get NFTs for this collection
    const { data: nfts, error: nftsError } = await supabase
      .from("nfts")
      .select("*")
      .eq("collection_id", id)
      .order("minted_at", { ascending: false });

    if (nftsError) {
      console.error("NFTs fetch error:", nftsError);
      return NextResponse.json(
        { error: "NFT履歴の取得に失敗しました" },
        { status: 500 }
      );
    }

    // Get collection info
    const { data: collection, error: collectionError } = await supabase
      .from("collections")
      .select("name, symbol, contract_address")
      .eq("id", id)
      .single();

    if (collectionError) {
      console.error("Collection fetch error:", collectionError);
      return NextResponse.json(
        { error: "コレクション情報の取得に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      nfts: nfts || [],
      collection,
      total: nfts?.length || 0
    });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}