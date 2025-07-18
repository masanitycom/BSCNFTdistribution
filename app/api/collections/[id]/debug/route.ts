import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { ethers } from "ethers";
import { getProvider } from "@/lib/blockchain";
import CollectionABI from "@/contracts/Collection.json";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    // Debug endpoint - no authentication required for troubleshooting
    console.log("Debug API called for collection:", id);

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

    let contractInfo = null;
    let tokenURIResult = null;

    // If contract is deployed, get contract info
    if (collection.contract_address) {
      try {
        const provider = getProvider();
        const contract = new ethers.Contract(
          collection.contract_address,
          CollectionABI.abi,
          provider
        );

        // Get contract info
        const name = await contract.name();
        const symbol = await contract.symbol();
        const totalSupply = await contract.totalSupply();
        
        // Try to get base URI (if it exists)
        let baseURI = "";
        try {
          // This might fail if the function doesn't exist
          if (contract.baseURI) {
            const baseURIResult = await contract.baseURI();
            baseURI = baseURIResult || "";
          }
        } catch (e) {
          console.log("Base URI function not available or failed:", e instanceof Error ? e.message : String(e));
        }

        contractInfo = {
          name,
          symbol,
          totalSupply: totalSupply.toString(),
          baseURI,
          address: collection.contract_address
        };

        // Test tokenURI for token ID 1 if any tokens exist
        if (totalSupply > 0) {
          try {
            tokenURIResult = await contract.tokenURI(1);
          } catch (e) {
            tokenURIResult = `Error getting tokenURI: ${e instanceof Error ? e.message : String(e)}`;
          }
        }

      } catch (error) {
        contractInfo = { error: error instanceof Error ? error.message : String(error) };
      }
    }

    // Test metadata endpoint
    const metadataURL = `https://bscnf-tdistribution.vercel.app/api/collections/${id}/metadata/1`;
    
    return NextResponse.json({
      success: true,
      collection: {
        id: collection.id,
        name: collection.name,
        symbol: collection.symbol,
        description: collection.description,
        image_ipfs: collection.image_ipfs,
        metadata_ipfs: collection.metadata_ipfs,
        contract_address: collection.contract_address,
        next_token_id: collection.next_token_id
      },
      contractInfo,
      tokenURIResult,
      expectedMetadataURL: metadataURL,
      imageURL: collection.image_ipfs ? `https://gateway.pinata.cloud/ipfs/${collection.image_ipfs}` : null
    });

  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      { error: "デバッグ中にエラーが発生しました" },
      { status: 500 }
    );
  }
}