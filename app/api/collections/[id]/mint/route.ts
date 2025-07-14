import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { mintNFTWithURI } from "@/lib/blockchain";

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

    const { wallet_address, recipient_name, token_id } = await request.json();

    if (!wallet_address || !wallet_address.startsWith("0x")) {
      return NextResponse.json(
        { error: "有効なウォレットアドレスを入力してください" },
        { status: 400 }
      );
    }

    // Get collection
    const { data: collection, error: collectionError } = await supabase
      .from("collections")
      .select("*")
      .eq("id", id)
      .single();

    if (collectionError || !collection) {
      return NextResponse.json(
        { error: "コレクションが見つかりません" },
        { status: 404 }
      );
    }

    if (!collection.contract_address) {
      return NextResponse.json(
        { error: "コントラクトがデプロイされていません" },
        { status: 400 }
      );
    }

    // Generate token ID if not provided
    let finalTokenId = token_id;
    if (!finalTokenId) {
      // Use next_token_id or generate random
      finalTokenId = collection.next_token_id || Math.floor(Math.random() * 999999) + 1;
    }

    // Check if token ID already exists
    const { data: existingNFT } = await supabase
      .from("nfts")
      .select("id")
      .eq("collection_id", id)
      .eq("token_id", finalTokenId)
      .single();

    if (existingNFT) {
      return NextResponse.json(
        { error: `トークンID ${finalTokenId} は既に使用されています` },
        { status: 400 }
      );
    }

    // Create metadata URI for this specific NFT
    const metadataURI = `https://bscnf-tdistribution.vercel.app/api/collections/${id}/metadata/${finalTokenId}`;

    console.log("Minting NFT:", {
      contractAddress: collection.contract_address,
      to: wallet_address,
      tokenId: finalTokenId,
      metadataURI
    });

    // Mint NFT on blockchain with specific URI
    const txHash = await mintNFTWithURI(
      collection.contract_address,
      wallet_address,
      finalTokenId,
      metadataURI
    );

    // Save NFT record to database
    const { data: nft, error: nftError } = await supabase
      .from("nfts")
      .insert({
        collection_id: id,
        token_id: finalTokenId,
        owner_address: wallet_address,
        tx_hash: txHash,
        recipient_name: recipient_name || null
      })
      .select()
      .single();

    if (nftError) {
      console.error("NFT record creation error:", nftError);
      // NFT was minted on blockchain but failed to save in DB
      return NextResponse.json({
        success: true,
        warning: "NFTはミントされましたが、データベースの保存に失敗しました",
        txHash,
        tokenId: finalTokenId,
        contractAddress: collection.contract_address
      });
    }

    // Update collection's next_token_id
    if (!token_id) {
      await supabase
        .from("collections")
        .update({ next_token_id: finalTokenId + 1 })
        .eq("id", id);
    }

    return NextResponse.json({
      success: true,
      message: "NFTのミントが完了しました",
      nft: {
        id: nft.id,
        tokenId: finalTokenId,
        txHash,
        contractAddress: collection.contract_address,
        ownerAddress: wallet_address,
        recipientName: recipient_name
      }
    });

  } catch (error) {
    console.error("Mint error:", error);
    return NextResponse.json(
      { error: `ミントに失敗しました: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}