import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tokenId: string }> }
) {
  const { id, tokenId } = await params;
  
  try {
    // Get collection
    const { data: collection, error: collectionError } = await supabase
      .from("collections")
      .select("*")
      .eq("id", id)
      .single();

    if (collectionError || !collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    // Get NFT
    const { data: nft, error: nftError } = await supabase
      .from("nfts")
      .select("*")
      .eq("collection_id", id)
      .eq("token_id", parseInt(tokenId))
      .single();

    // Return metadata in OpenSea format
    const metadata = {
      name: `${collection.name} #${tokenId}`,
      description: collection.description || "",
      image: `https://gateway.pinata.cloud/ipfs/${collection.image_ipfs}`,
      external_url: `https://bscnf-tdistribution.vercel.app/gallery/${id}`,
      attributes: [
        {
          trait_type: "Collection",
          value: collection.name
        },
        {
          trait_type: "Token ID",
          value: tokenId
        }
      ]
    };

    if (nft) {
      metadata.attributes.push({
        trait_type: "Recipient",
        value: nft.recipient_name || "Unknown"
      });
    }

    return NextResponse.json(metadata, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });

  } catch (error) {
    console.error("Metadata API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}