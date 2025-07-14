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
      .order("minted_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "NFTの取得に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      nfts: nfts || [],
      count: nfts?.length || 0
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}