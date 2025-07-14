import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { deployCollection } from "@/lib/blockchain";
import { getIPFSProtocolUrl } from "@/lib/ipfs";

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

    // Get collection
    const { data: collection } = await supabase
      .from("collections")
      .select("*")
      .eq("id", id)
      .single();

    if (!collection) {
      return NextResponse.json(
        { error: "コレクションが見つかりません" },
        { status: 404 }
      );
    }

    if (collection.contract_address) {
      return NextResponse.json(
        { error: "既にデプロイされています" },
        { status: 400 }
      );
    }

    if (!collection.image_ipfs || !collection.metadata_ipfs) {
      return NextResponse.json(
        { error: "先に画像をアップロードしてください" },
        { status: 400 }
      );
    }

    // Deploy contract - use HTTPS gateway for better MetaMask compatibility
    const baseURI = `https://gateway.pinata.cloud/ipfs/${collection.metadata_ipfs}`;
    const contractAddress = await deployCollection(
      collection.name,
      collection.symbol,
      baseURI
    );

    // Update collection with contract address
    const { error: updateError } = await supabase
      .from("collections")
      .update({ contract_address: contractAddress })
      .eq("id", id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      contractAddress,
      message: "コントラクトのデプロイが完了しました"
    });
  } catch (error) {
    console.error("Deploy error:", error);
    return NextResponse.json(
      { error: "デプロイに失敗しました" },
      { status: 500 }
    );
  }
}