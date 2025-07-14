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
      .order("token_id", { ascending: true });

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

    // Create CSV content
    const csvHeader = "NFT_ID,ウォレットアドレス,受取人名,コントラクトアドレス,トランザクションハッシュ,ミント日時\n";
    const csvRows = (nfts || []).map(nft => {
      const mintedAt = nft.minted_at ? new Date(nft.minted_at).toLocaleString('ja-JP') : '';
      return [
        nft.token_id,
        nft.owner_address,
        nft.recipient_name || '',
        collection.contract_address || '',
        nft.tx_hash || '',
        mintedAt
      ].join(',');
    }).join('\n');

    const csvContent = csvHeader + csvRows;
    
    // Set headers for CSV download
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv; charset=utf-8');
    headers.set('Content-Disposition', `attachment; filename="${collection.name}_distribution_${new Date().toISOString().split('T')[0]}.csv"`);
    
    return new Response(csvContent, { headers });

  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "エクスポート中にエラーが発生しました" },
      { status: 500 }
    );
  }
}