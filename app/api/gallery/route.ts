import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: nfts, error } = await supabase
      .from("nfts")
      .select(`
        *,
        collections(name, symbol, image_ipfs)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "NFTの取得に失敗しました" },
        { status: 500 }
      );
    }

    // Transform data to match expected structure
    const transformedNFTs = (nfts || []).map(nft => ({
      ...nft,
      collection: nft.collections // Supabase returns as 'collections'
    }));

    return NextResponse.json({
      nfts: transformedNFTs,
      count: transformedNFTs.length
    });
  } catch (error) {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}