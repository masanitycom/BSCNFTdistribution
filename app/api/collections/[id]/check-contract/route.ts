import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { ethers } from "ethers";
import { getProvider } from "@/lib/blockchain";
import CollectionABI from "@/contracts/Collection.json";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    // Get collection
    const { data: collection } = await supabase
      .from("collections")
      .select("*")
      .eq("id", id)
      .single();

    if (!collection?.contract_address) {
      return NextResponse.json({ error: "No contract found" }, { status: 404 });
    }

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
    const owner = await contract.owner();

    // Check specific token
    let tokenOwner = null;
    let tokenURI = null;
    let tokenExists = false;

    try {
      tokenOwner = await contract.ownerOf(4);
      tokenURI = await contract.tokenURI(4);
      tokenExists = true;
    } catch (e) {
      tokenExists = false;
    }

    // Check if adminMint function exists
    let adminMintExists = false;
    try {
      const fragment = contract.interface.getFunction("adminMint");
      adminMintExists = !!fragment;
    } catch (e) {
      adminMintExists = false;
    }

    return NextResponse.json({
      contractAddress: collection.contract_address,
      contractInfo: {
        name,
        symbol,
        totalSupply: totalSupply.toString(),
        owner
      },
      tokenId4: {
        exists: tokenExists,
        owner: tokenOwner,
        tokenURI
      },
      functions: {
        adminMintExists
      },
      contractABI: CollectionABI.abi.map(f => f.name).filter(Boolean)
    });

  } catch (error) {
    console.error("Contract check error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}