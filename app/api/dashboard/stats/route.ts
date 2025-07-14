import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    // Get collections count (excluding hidden ones)
    const { data: collections, error: collectionsError } = await supabase
      .from("collections")
      .select("id, description")
      .order("created_at", { ascending: false });

    if (collectionsError) {
      throw collectionsError;
    }

    // Filter out hidden collections
    const visibleCollections = (collections || []).filter(
      collection => !(collection.description && collection.description.includes("[HIDDEN]"))
    );

    // Get NFTs count
    const { data: nfts, error: nftsError } = await supabase
      .from("nfts")
      .select("id");

    if (nftsError) {
      throw nftsError;
    }

    // Get unique recipients count (as a proxy for distribution jobs)
    const { data: recipients, error: recipientsError } = await supabase
      .from("nfts")
      .select("owner_address");

    if (recipientsError) {
      throw recipientsError;
    }

    const uniqueRecipients = recipients ? 
      [...new Set(recipients.map(nft => nft.owner_address))].length : 0;


    return NextResponse.json({
      totalCollections: visibleCollections.length,
      totalNFTs: (nfts || []).length,
      totalUsers: uniqueRecipients
    });

  } catch (error) {
    return NextResponse.json(
      { error: "統計の取得に失敗しました" },
      { status: 500 }
    );
  }
}