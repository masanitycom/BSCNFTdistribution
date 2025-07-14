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
      console.error("Collections error:", collectionsError);
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
      console.error("NFTs error:", nftsError);
    }

    // Get unique recipients count (as a proxy for distribution jobs)
    const { data: recipients, error: recipientsError } = await supabase
      .from("nfts")
      .select("owner_address");

    if (recipientsError) {
      console.error("Recipients error:", recipientsError);
    }

    const uniqueRecipients = recipients ? 
      [...new Set(recipients.map(nft => nft.owner_address))].length : 0;

    console.log("Dashboard stats:", {
      collections: visibleCollections.length,
      nfts: (nfts || []).length,
      recipients: uniqueRecipients
    });

    return NextResponse.json({
      totalCollections: visibleCollections.length,
      totalNFTs: (nfts || []).length,
      totalUsers: uniqueRecipients
    });

  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "統計の取得に失敗しました" },
      { status: 500 }
    );
  }
}