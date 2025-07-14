import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { mintNFT } from "@/lib/blockchain";

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

    const requestBody = await request.json();
    const { wallet_address, recipient_name, start_token_id, quantity } = requestBody;

    console.log("=== BATCH MINT REQUEST DEBUG ===");
    console.log("Request body:", requestBody);
    console.log("Wallet address:", wallet_address);
    console.log("Quantity:", quantity);
    console.log("Start token ID:", start_token_id);
    console.log("==============================");

    if (!wallet_address || !wallet_address.startsWith("0x")) {
      return NextResponse.json(
        { error: "有効なウォレットアドレスを入力してください" },
        { status: 400 }
      );
    }

    if (!quantity || quantity <= 0 || quantity > 500) {
      return NextResponse.json(
        { error: "数量は1～500の範囲で入力してください" },
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

    // Generate token IDs
    let currentTokenId = start_token_id || collection.next_token_id || 1;
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    console.log("=== BATCH MINT PROCESSING ===");
    console.log("Starting token ID:", currentTokenId);
    console.log("Contract address:", collection.contract_address);
    console.log("Target address:", wallet_address);
    console.log("============================");

    // Process each NFT
    for (let i = 0; i < quantity; i++) {
      const tokenId = currentTokenId + i;
      
      try {
        // Check if token ID already exists
        const { data: existingNFT } = await supabase
          .from("nfts")
          .select("id")
          .eq("collection_id", id)
          .eq("token_id", tokenId)
          .single();

        if (existingNFT) {
          console.log(`Token ID ${tokenId} already exists, skipping...`);
          errorCount++;
          results.push({
            tokenId,
            success: false,
            error: `トークンID ${tokenId} は既に使用されています`
          });
          continue;
        }

        // Mint NFT on blockchain
        const txHash = await mintNFT(
          collection.contract_address,
          wallet_address.trim(),
          tokenId
        );

        console.log(`NFT ${tokenId} minted successfully. TX: ${txHash}`);

        // Save NFT record to database
        const { error: nftError } = await supabase
          .from("nfts")
          .insert({
            collection_id: id,
            token_id: tokenId,
            owner_address: wallet_address,
            tx_hash: txHash,
            recipient_name: recipient_name || null
          });

        if (nftError) {
          console.error(`Database error for token ${tokenId}:`, nftError);
          errorCount++;
          results.push({
            tokenId,
            success: false,
            error: "データベースの保存に失敗しました",
            txHash
          });
        } else {
          successCount++;
          results.push({
            tokenId,
            success: true,
            txHash
          });
        }

        // Small delay to prevent overwhelming the blockchain
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Mint error for token ${tokenId}:`, error);
        errorCount++;
        results.push({
          tokenId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    // Update collection's next_token_id
    const nextTokenId = currentTokenId + quantity;
    await supabase
      .from("collections")
      .update({ next_token_id: nextTokenId })
      .eq("id", id);

    console.log("=== BATCH MINT RESULTS ===");
    console.log("Success count:", successCount);
    console.log("Error count:", errorCount);
    console.log("Next token ID:", nextTokenId);
    console.log("=========================");

    return NextResponse.json({
      success: true,
      message: `バッチミントが完了しました`,
      startTokenId: currentTokenId,
      endTokenId: currentTokenId + quantity - 1,
      successCount,
      errorCount,
      totalCount: quantity,
      nextTokenId,
      results
    });

  } catch (error) {
    console.error("Batch mint error:", error);
    return NextResponse.json(
      { error: `バッチミントに失敗しました: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}