import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { mintNFT } from "@/lib/blockchain";

export const maxDuration = 300; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    // Get pending jobs
    const { data: jobs } = await supabase
      .from("distribution_jobs")
      .select(`
        *,
        collections(*)
      `)
      .eq("status", "PENDING")
      .limit(1);

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ message: "No pending jobs" });
    }

    const job = jobs[0];
    const collection = job.collections;

    if (!collection.contract_address) {
      await supabase
        .from("distribution_jobs")
        .update({
          status: "ERROR",
          log: "コレクションが未デプロイです",
          finished_at: new Date().toISOString()
        })
        .eq("id", job.id);
      
      return NextResponse.json({ error: "Collection not deployed" });
    }

    // Update job status to RUNNING
    await supabase
      .from("distribution_jobs")
      .update({
        status: "RUNNING",
        started_at: new Date().toISOString()
      })
      .eq("id", job.id);

    const logs: string[] = [];
    let successCount = 0;
    let errorCount = 0;
    let currentTokenId = collection.next_token_id;

    // Process CSV data
    for (const row of job.csv_original) {
      const quantity = parseInt(row.quantity);
      
      for (let i = 0; i < quantity; i++) {
        try {
          const txHash = await mintNFT(
            collection.contract_address,
            row.wallet_address,
            currentTokenId
          );

          // Save NFT record
          await supabase
            .from("nfts")
            .insert({
              collection_id: collection.id,
              token_id: currentTokenId,
              owner_address: row.wallet_address,
              tx_hash: txHash
            });

          logs.push(`✓ Minted token #${currentTokenId} to ${row.wallet_address} (${row.recipient_name})`);
          successCount++;
          currentTokenId++;
        } catch (error: any) {
          logs.push(`✗ Failed to mint token #${currentTokenId}: ${error.message}`);
          errorCount++;
        }
      }
    }

    // Update collection's next token ID
    await supabase
      .from("collections")
      .update({ next_token_id: currentTokenId })
      .eq("id", collection.id);

    // Update job status
    await supabase
      .from("distribution_jobs")
      .update({
        status: errorCount === 0 ? "DONE" : "ERROR",
        log: logs.join("\n"),
        finished_at: new Date().toISOString()
      })
      .eq("id", job.id);

    return NextResponse.json({
      success: true,
      successCount,
      errorCount,
      message: `配布完了: ${successCount}個成功, ${errorCount}個失敗`
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "配布処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}